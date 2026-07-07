import logging
from datetime import datetime, timedelta, timezone

from bson import ObjectId
from pymongo import ReturnDocument

from app.database import get_database
from app.models.user import User
from app.services import clerk_client

logger = logging.getLogger(__name__)

COLLECTION = "users"
LESSON_COMPLETE_XP = 50
LESSON_COMPLETE_GOLD = 10

# Collections that scope data to a user id — cascaded when a legacy account is
# re-keyed onto its Clerk identity (see _migrate_legacy_user).
_OWNED_COLLECTIONS = (("courses", "owner_id"), ("generation_jobs", "owner_id"), ("activity_log", "user_id"))


async def get_user_by_email(email: str) -> User | None:
    db = get_database()
    doc = await db[COLLECTION].find_one({"email": email.lower()})
    return User(**doc) if doc else None


async def get_user_by_id(user_id: str) -> User | None:
    db = get_database()
    doc = await db[COLLECTION].find_one({"_id": user_id})
    return User(**doc) if doc else None


async def award_rewards(user_id: str, xp_delta: int, gold_delta: int) -> User | None:
    """Applies an XP/gold delta (positive on completion, negative on
    un-completion) and returns the user's fresh totals in one round-trip."""
    db = get_database()
    doc = await db[COLLECTION].find_one_and_update(
        {"_id": user_id},
        {"$inc": {"xp": xp_delta, "gold": gold_delta}},
        return_document=ReturnDocument.AFTER,
    )
    if not doc:
        return None
    if doc["xp"] < 0 or doc["gold"] < 0:
        doc["xp"] = max(doc["xp"], 0)
        doc["gold"] = max(doc["gold"], 0)
        await db[COLLECTION].update_one({"_id": user_id}, {"$set": {"xp": doc["xp"], "gold": doc["gold"]}})
    return User(**doc)


async def bump_streak(user_id: str) -> User | None:
    """Idempotent per calendar day (UTC): repeat calls on the same day no-op.
    Called from every auth response so a streak updates whether the user just
    logged in, signed up, or is resuming an existing session."""
    db = get_database()
    doc = await db[COLLECTION].find_one({"_id": user_id})
    if not doc:
        return None

    today = datetime.now(timezone.utc).date()
    last_active = doc.get("last_active_date")
    current_streak = doc.get("current_streak", 0)
    longest_streak = doc.get("longest_streak", 0)

    if last_active == today.isoformat():
        return User(**doc)

    if last_active == (today - timedelta(days=1)).isoformat():
        current_streak += 1
    else:
        current_streak = 1
    longest_streak = max(longest_streak, current_streak)

    updated = await db[COLLECTION].find_one_and_update(
        {"_id": user_id},
        {
            "$set": {
                "current_streak": current_streak,
                "longest_streak": longest_streak,
                "last_active_date": today.isoformat(),
            }
        },
        return_document=ReturnDocument.AFTER,
    )
    return User(**updated)


async def _migrate_legacy_user(legacy: User, clerk_user_id: str, profile: dict) -> User:
    """Re-keys a pre-Clerk (email/password) account onto its Clerk identity
    when the same email signs in via Clerk — preserves xp/gold/streaks/courses
    instead of starting the user over. Mongo _id is immutable, so this copies
    the doc onto the new id and cascades every owner_id/user_id reference."""
    db = get_database()
    old_id = legacy.id

    doc = legacy.model_dump(by_alias=True, exclude={"id", "password_hash"})
    doc["_id"] = clerk_user_id
    doc["name"] = profile.get("name") or legacy.name
    doc["email"] = profile.get("email") or legacy.email
    await db[COLLECTION].delete_one({"_id": ObjectId(old_id)})
    await db[COLLECTION].insert_one(doc)

    for collection, field in _OWNED_COLLECTIONS:
        await db[collection].update_many({field: old_id}, {"$set": {field: clerk_user_id}})

    logger.info("Migrated legacy account onto Clerk identity user_id=%s", clerk_user_id)
    return User(**doc)


async def _create_clerk_user(clerk_user_id: str, profile: dict) -> User:
    db = get_database()
    user = User(id=clerk_user_id, name=profile["name"], email=profile["email"])
    doc = user.model_dump(by_alias=True)
    doc["_id"] = clerk_user_id
    await db[COLLECTION].insert_one(doc)
    logger.info("Created new user profile for Clerk identity user_id=%s", clerk_user_id)
    return user


async def get_or_create_from_clerk(clerk_user_id: str) -> User:
    """Resolves the authenticated Clerk user to a local profile: reuses it if
    one already exists under this Clerk id, adopts a matching pre-Clerk
    account by email (see _migrate_legacy_user), or creates a fresh one —
    then bumps the daily streak exactly like every previous auth response did."""
    existing = await get_user_by_id(clerk_user_id)
    if existing:
        return await bump_streak(existing.id) or existing

    profile = await clerk_client.fetch_clerk_profile(clerk_user_id)
    legacy = await get_user_by_email(profile["email"]) if profile["email"] else None

    if legacy and legacy.id != clerk_user_id:
        user = await _migrate_legacy_user(legacy, clerk_user_id, profile)
    else:
        user = await _create_clerk_user(clerk_user_id, profile)

    return await bump_streak(user.id) or user
