"""Pluggable pre-generation guardrails. Runs before the course-generation
pipeline; additional checks (profanity filters, length limits, etc.) can be
appended to `_GUARDRAILS` without touching generation_service or callers."""

import logging
from typing import Awaitable, Callable

from app.agents.retry import with_retries
from app.agents.schemas import TopicValidationSchema
from app.agents.topic_validator import validate_topic
from app.models.course import CourseGenerateRequest

logger = logging.getLogger(__name__)

Guardrail = Callable[[CourseGenerateRequest], Awaitable[TopicValidationSchema]]

_GUARDRAILS: list[Guardrail] = [validate_topic]


class TopicRejected(Exception):
    def __init__(self, result: TopicValidationSchema):
        self.result = result
        super().__init__(result.reason)


async def run_guardrails(request: CourseGenerateRequest) -> None:
    for guardrail in _GUARDRAILS:
        result: TopicValidationSchema = await with_retries(guardrail, request)
        logger.info(
            "Topic validation for %r: valid=%s confidence=%s reason=%r",
            request.topic,
            result.is_valid,
            result.confidence,
            result.reason,
        )
        if not result.is_valid:
            raise TopicRejected(result)
