from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field

from app.models.common import PyObjectId


class User(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    # For Clerk-native users this is the Clerk user id (e.g. "user_2abc..."),
    # stored directly as Mongo's _id — not a real ObjectId. PyObjectId just
    # coerces to str, so it accepts either.
    id: PyObjectId | None = Field(default=None, alias="_id")
    name: str
    email: str
    # Only ever set on pre-Clerk accounts; Clerk owns authentication now, so
    # nothing writes this field anymore.
    password_hash: str | None = None
    xp: int = 0
    gold: int = 0
    current_streak: int = 0
    longest_streak: int = 0
    last_active_date: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


XP_PER_LEVEL = 500


def level_progress(xp: int) -> dict:
    """Derives level/progress from xp so there's one source of truth — level is
    never stored, only computed."""
    level = xp // XP_PER_LEVEL + 1
    xp_into_level = xp % XP_PER_LEVEL
    return {
        "level": level,
        "xp_into_level": xp_into_level,
        "xp_to_next": XP_PER_LEVEL - xp_into_level,
    }
