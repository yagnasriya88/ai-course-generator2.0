"""Pydantic schemas used to force structured output from CrewAI tasks
(`output_pydantic=`). Kept separate from app.models, which are the MongoDB
persistence shapes — these are purely LLM-output contracts."""

from pydantic import BaseModel, Field


class CourseOutlineModuleSchema(BaseModel):
    title: str


class CourseOutlineSchema(BaseModel):
    title: str
    description: str
    tags: list[str] = Field(default_factory=list)
    modules: list[CourseOutlineModuleSchema]


class LessonContentBlockSchema(BaseModel):
    type: str = Field(description="One of: heading, paragraph, code, exercise, image, takeaway")
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
