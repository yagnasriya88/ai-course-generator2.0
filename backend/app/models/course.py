from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field

from app.models.common import PyObjectId
from app.models.lesson import QuizQuestion


class CourseGenerateRequest(BaseModel):
    topic: str
    level: str | None = None
    goals: str | None = None
    study_time: str | None = None


class LessonStub(BaseModel):
    id: str
    title: str
    is_enriched: bool = False


class ModuleOutline(BaseModel):
    id: str
    title: str
    lessons: list[LessonStub] = Field(default_factory=list)
    quiz: list[QuizQuestion] = Field(default_factory=list)
    quiz_completed: bool = False
    quiz_score: int | None = None
    quiz_total: int | None = None


class Course(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: PyObjectId | None = Field(default=None, alias="_id")
    owner_id: str
    title: str
    description: str
    tags: list[str] = Field(default_factory=list)
    level: str | None = None
    goals: str | None = None
    study_time: str | None = None
    modules: list[ModuleOutline] = Field(default_factory=list)
    completed_lesson_ids: list[str] = Field(default_factory=list)
    cover_image_url: str | None = None
    is_platform: bool = False
    template_id: str | None = None
    # Exact seed topic for platform templates — the AI-generated `title` is
    # non-deterministic, so re-seeding idempotency checks this field instead.
    source_topic: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
