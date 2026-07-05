"""Pydantic schemas used to force structured output from CrewAI tasks
(`output_pydantic=`). Kept separate from app.models, which are the MongoDB
persistence shapes — these are purely LLM-output contracts."""

from typing import Literal

from pydantic import BaseModel, Field


class TopicValidationSchema(BaseModel):
    is_valid: bool
    confidence: float = Field(description="0.0-1.0 confidence in this verdict")
    reason: str = Field(description="Brief explanation of why the topic was accepted or rejected")
    suggestion: str | None = Field(
        default=None, description="If invalid, a concrete rephrasing the user could try instead"
    )


class CourseOutlineModuleSchema(BaseModel):
    title: str


class CourseOutlineSchema(BaseModel):
    title: str
    description: str
    tags: list[str] = Field(default_factory=list)
    modules: list[CourseOutlineModuleSchema]


class LessonContentBlockSchema(BaseModel):
    # A plain `str` here let past LLM output emit stray types like "language"
    # (confusing the code-block's `language` field for a block type of its own),
    # which then blew up ContentBlock's stricter Literal downstream — pinning the
    # same Literal here makes CrewAI's own output validation catch it immediately,
    # so `with_retries` gets a chance to retry instead of the whole course crashing.
    type: Literal["heading", "paragraph", "code", "exercise", "image", "takeaway"]
    text: str | None = None
    language: str | None = Field(default=None, description="Only set when type is 'code'")


class GeneratedLessonSchema(BaseModel):
    title: str
    objectives: list[str]
    content: list[LessonContentBlockSchema]


class ModuleLessonsSchema(BaseModel):
    lessons: list[GeneratedLessonSchema]


class QuizQuestionSchema(BaseModel):
    type: str = Field(description="One of: mcq, true_false, fill_blank, coding")
    question: str
    options: list[str] | None = None
    correct_answer: str
    explanation: str


class QuizSchema(BaseModel):
    questions: list[QuizQuestionSchema]


class VisualAidSchema(BaseModel):
    type: str = Field(
        description=(
            "One of: mindmap, flowchart, concept_map, process_diagram, timeline, "
            "comparison_table"
        )
    )
    title: str
    mermaid: str = Field(description="Valid Mermaid diagram syntax rendering this visual aid")


class VisualAidsSchema(BaseModel):
    aids: list[VisualAidSchema]
