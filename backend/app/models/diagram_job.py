from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field

from app.models.common import PyObjectId
from app.models.diagram import DiagramGenerateRequest
from app.models.job import JobStatus


class DiagramJob(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: PyObjectId | None = Field(default=None, alias="_id")
    owner_id: str
    request: DiagramGenerateRequest
    dedupe_key: str
    status: JobStatus = "queued"
    diagram_id: str | None = None
    error: str | None = None
    attempts: int = 0
    max_attempts: int = 3
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    started_at: datetime | None = None
    finished_at: datetime | None = None
