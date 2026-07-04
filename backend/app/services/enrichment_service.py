import asyncio
import logging
import time

from app.agents import video_agent, visual_agent
from app.agents.retry import with_retries
from app.models.lesson import Lesson
from app.services import lesson_service

logger = logging.getLogger(__name__)


async def auto_enrich_lesson(lesson: Lesson) -> Lesson:
    """Video/Visual are meant to appear automatically the first time a lesson is opened —
    this runs both concurrently, then caches the result via `auto_enriched`. Quizzes are
    module-scoped (generated lazily once all lessons in the module are complete, see
    `course_service.set_module_quiz`), so they're not part of per-lesson enrichment. Hinglish
    stays a separate explicit endpoint (button-triggered, not automatic)."""
    if lesson.auto_enriched:
        return lesson

    assert lesson.id is not None
    start = time.perf_counter()
    logger.info("Auto-enrichment started: lesson_id=%s title=%r", lesson.id, lesson.title)

    videos, visual_aids = await asyncio.gather(
        with_retries(video_agent.discover_videos, lesson),
        with_retries(visual_agent.generate_visual_aids, lesson),
        return_exceptions=True,
    )
    if isinstance(visual_aids, BaseException):
        raise visual_aids
    if isinstance(videos, BaseException):
        # Video discovery is Gemini-only and its free tier exhausts fast — don't let
        # that take down the whole lesson when visual_aids (OpenAI) succeeded.
        logger.warning(
            "Video discovery failed, continuing without videos: lesson_id=%s error=%s",
            lesson.id,
            videos,
        )
        videos = []
    logger.info(
        "Auto-enrichment complete: lesson_id=%s %d videos, %d visual aids in %.1fs",
        lesson.id,
        len(videos),
        len(visual_aids),
        time.perf_counter() - start,
    )

    await asyncio.gather(
        lesson_service.set_videos(lesson.id, videos),
        lesson_service.set_visual_aids(lesson.id, visual_aids),
        lesson_service.mark_auto_enriched(lesson.id),
    )

    lesson.videos = videos
    lesson.visual_aids = visual_aids
    lesson.auto_enriched = True
    return lesson
