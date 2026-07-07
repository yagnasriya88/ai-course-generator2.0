"""Pluggable pre-generation guardrails for diagram requests. Runs before the
diagram-generation pipeline; additional checks can be appended to
_GUARDRAILS without touching diagram_generation_service or callers."""

import logging
from typing import Awaitable, Callable

from app.agents.diagram_validator import validate_diagram_request
from app.agents.retry import with_retries
from app.agents.schemas import DiagramValidationSchema
from app.models.diagram import DiagramGenerateRequest

logger = logging.getLogger(__name__)

Guardrail = Callable[[DiagramGenerateRequest], Awaitable[DiagramValidationSchema]]

_GUARDRAILS: list[Guardrail] = [validate_diagram_request]


class DiagramRejected(Exception):
    def __init__(self, result: DiagramValidationSchema):
        self.result = result
        super().__init__(result.reason)


async def run_guardrails(request: DiagramGenerateRequest) -> None:
    for guardrail in _GUARDRAILS:
        result: DiagramValidationSchema = await with_retries(guardrail, request)
        logger.info(
            "Diagram validation for topic=%r type=%r: valid=%s confidence=%s reason=%r suggested_type=%r",
            request.topic,
            request.diagram_type,
            result.is_valid,
            result.confidence,
            result.reason,
            result.suggested_type,
        )
        if not result.is_valid:
            raise DiagramRejected(result)
