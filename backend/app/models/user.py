import re
from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.common import PyObjectId

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class UserSignupRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: str
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        if not EMAIL_RE.match(value):
            raise ValueError("Enter a valid email address")
        return value.lower()


class UserLoginRequest(BaseModel):
    email: str
    password: str


class User(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: PyObjectId | None = Field(default=None, alias="_id")
    name: str
    email: str
    password_hash: str
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
