from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field

from app.models.common import PyObjectId


class TimestampNote(BaseModel):
    time: str
    note: str


class VideoNote(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: PyObjectId | None = Field(default=None, alias="_id")
    lesson_id: str
    video_url: str
    summary: str
    key_concepts: list[str] = Field(default_factory=list)
    timestamps: list[TimestampNote] = Field(default_factory=list)
    revision_notes: list[str] = Field(default_factory=list)
    takeaways: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
