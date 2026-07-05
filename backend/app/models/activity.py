from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field

from app.models.common import PyObjectId


class ActivityEntry(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: PyObjectId | None = Field(default=None, alias="_id")
    user_id: str
    course_id: str
    course_title: str
    lesson_id: str
    lesson_title: str
    xp_awarded: int
    gold_awarded: int
    completed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
