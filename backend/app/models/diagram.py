from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.models.common import PyObjectId

DiagramType = Literal["mindmap", "flowchart", "roadmap", "concept_map", "process_diagram"]


class DiagramGenerateRequest(BaseModel):
    topic: str
    diagram_type: DiagramType
    detail: str | None = None


class DiagramNode(BaseModel):
    id: str
    label: str
    group: str | None = None
    description: str | None = None
    x: float | None = None
    y: float | None = None


class DiagramEdge(BaseModel):
    source: str
    target: str
    label: str | None = None


class KnowledgeCanvas(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: PyObjectId | None = Field(default=None, alias="_id")
    owner_id: str
    title: str
    diagram_type: DiagramType
    source_topic: str
    nodes: list[DiagramNode] = Field(default_factory=list)
    edges: list[DiagramEdge] = Field(default_factory=list)
    is_favorite: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DiagramUpdateRequest(BaseModel):
    title: str | None = None
    is_favorite: bool | None = None
    nodes: list[DiagramNode] | None = None
    edges: list[DiagramEdge] | None = None


class DiagramAIEditRequest(BaseModel):
    instruction: str
