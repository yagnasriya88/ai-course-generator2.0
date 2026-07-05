"""Generates the official platform courses through the normal AI pipeline and
marks them as platform templates, visible to every user via the existing
clone-on-list mechanism (see course_service.ensure_platform_courses_for_user).

Idempotent: skips any topic that already has a platform course with a matching
title, so re-running after a partial failure doesn't duplicate courses or
burn extra API quota.

Run from backend/: .venv/Scripts/python -m scripts.seed_platform_courses
"""

import asyncio
import logging

from app.database import close_mongo_connection, connect_to_mongo
from app.logging_config import configure_logging
from app.models.course import CourseGenerateRequest
from app.services import course_service, generation_service

configure_logging()
logger = logging.getLogger(__name__)

PLATFORM_COURSE_TOPICS = [
    "Prompt Engineering",
    "CrewAI Crash Course",
    "Generative AI Essentials",
    "Introduction to Python",
    "Introduction to ReactJS",
    "JavaScript Essentials",
]


async def main():
    connect_to_mongo()

    existing_source_topics = {t.source_topic for t in await course_service.get_platform_templates()}

    for topic in PLATFORM_COURSE_TOPICS:
        if topic in existing_source_topics:
            logger.info("Skipping %r — platform course already exists", topic)
            continue

        logger.info("Generating platform course: %r", topic)
        try:
            course = await generation_service.generate_course(
                CourseGenerateRequest(topic=topic),
                owner_id=course_service.PLATFORM_OWNER_ID,
                is_platform=True,
                source_topic=topic,
            )
            logger.info("Created platform course %r (id=%s)", course.title, course.id)
        except Exception:
            logger.exception("Failed to generate platform course for topic %r", topic)

    close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(main())
