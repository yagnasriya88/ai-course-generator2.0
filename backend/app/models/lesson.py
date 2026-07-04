from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.models.common import PyObjectId


class ContentBlock(BaseModel):
    """Loose schema: fields vary by `type` (e.g. code has `language`, image has `alt`)."""

    model_config = ConfigDict(extra="allow")

    type: Literal["heading", "paragraph", "code", "exercise", "image", "takeaway"]


class QuizQuestion(BaseModel):
    id: str
    type: Literal["mcq", "true_false", "fill_blank", "coding"]
    question: str
    options: list[str] | None = None
    correct_answer: str
    explanation: str


class VideoRecommendation(BaseModel):
    title: str
    url: str
    query: str


class VisualAid(BaseModel):
    type: Literal[
        "mindmap", "flowchart", "concept_map", "process_diagram", "timeline", "comparison_table"
    ]
    title: str
    data: dict


class HinglishContent(BaseModel):
    text: str
    audio_base64: str | None = None


class Lesson(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: PyObjectId | None = Field(default=None, alias="_id")
    course_id: str
    module_id: str
    title: str
    objectives: list[str] = Field(default_factory=list)
    content: list[ContentBlock] = Field(default_factory=list)
    videos: list[VideoRecommendation] = Field(default_factory=list)
    visual_aids: list[VisualAid] = Field(default_factory=list)
    hinglish: HinglishContent | None = None
    is_enriched: bool = False
    # Whether Quiz/Video/Visual agents have run (on first lesson view). Separate from
    # is_enriched (base content, generated eagerly by Module Generator). Hinglish is
    # excluded — it's an explicit "Explain in Hinglish" button per spec, not automatic.
    auto_enriched: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
