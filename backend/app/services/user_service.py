from datetime import datetime, timedelta, timezone

from bson import ObjectId
from bson.errors import InvalidId
from pymongo import ReturnDocument

from app.database import get_database
from app.models.user import User

COLLECTION = "users"
LESSON_COMPLETE_XP = 50
LESSON_COMPLETE_GOLD = 10


async def create_user(user: User) -> User:
    db = get_database()
    doc = user.model_dump(by_alias=True, exclude={"id"})
    result = await db[COLLECTION].insert_one(doc)
    user.id = str(result.inserted_id)
    return user


async def get_user_by_email(email: str) -> User | None:
    db = get_database()
    doc = await db[COLLECTION].find_one({"email": email.lower()})
    return User(**doc) if doc else None


async def get_user_by_id(user_id: str) -> User | None:
    try:
        object_id = ObjectId(user_id)
    except InvalidId:
        return None
    db = get_database()
    doc = await db[COLLECTION].find_one({"_id": object_id})
    return User(**doc) if doc else None


async def award_rewards(user_id: str, xp_delta: int, gold_delta: int) -> User | None:
    """Applies an XP/gold delta (positive on completion, negative on
    un-completion) and returns the user's fresh totals in one round-trip."""
    db = get_database()
    doc = await db[COLLECTION].find_one_and_update(
        {"_id": ObjectId(user_id)},
        {"$inc": {"xp": xp_delta, "gold": gold_delta}},
        return_document=ReturnDocument.AFTER,
    )
    if not doc:
        return None
    if doc["xp"] < 0 or doc["gold"] < 0:
        doc["xp"] = max(doc["xp"], 0)
        doc["gold"] = max(doc["gold"], 0)
        await db[COLLECTION].update_one(
            {"_id": ObjectId(user_id)}, {"$set": {"xp": doc["xp"], "gold": doc["gold"]}}
        )
    return User(**doc)


async def bump_streak(user_id: str) -> User | None:
    """Idempotent per calendar day (UTC): repeat calls on the same day no-op.
    Called from every auth response so a streak updates whether the user just
    logged in, signed up, or is resuming an existing session."""
    db = get_database()
    doc = await db[COLLECTION].find_one({"_id": ObjectId(user_id)})
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
        {"_id": ObjectId(user_id)},
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
