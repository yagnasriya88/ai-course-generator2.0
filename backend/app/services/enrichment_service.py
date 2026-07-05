import asyncio
import logging
import time

from app.agents import video_agent, visual_agent
from app.agents.retry import with_retries
from app.models.lesson import Lesson
from app.services import lesson_service

logger = logging.getLogger(__name__)


async def auto_enrich_lesson(lesson: Lesson) -> Lesson:
    """Video/Visual are meant to appear automatically the first time a lesson is opened.
    Tracked with separate flags (`auto_enriched` for visuals, `videos_enriched` for videos)
    and retried independently — a video-discovery failure (Gemini free tier exhausts fast)
    must not permanently suppress retries just because visual_aids (OpenAI) succeeded.
    Quizzes are module-scoped (generated lazily once all lessons in the module are complete,
    see `course_service.set_module_quiz`), so they're not part of per-lesson enrichment.
    Hinglish stays a separate explicit endpoint (button-triggered, not automatic)."""
    needs_videos = not lesson.videos_enriched
    needs_visuals = not lesson.auto_enriched
    if not needs_videos and not needs_visuals:
        return lesson

    assert lesson.id is not None
    start = time.perf_counter()
    logger.info("Auto-enrichment started: lesson_id=%s title=%r", lesson.id, lesson.title)

    tasks = {}
    if needs_videos:
        tasks["videos"] = with_retries(video_agent.discover_videos, lesson)
    if needs_visuals:
        tasks["visual_aids"] = with_retries(visual_agent.generate_visual_aids, lesson)
    outcomes = dict(zip(tasks.keys(), await asyncio.gather(*tasks.values(), return_exceptions=True)))

    if needs_visuals:
        visual_aids = outcomes["visual_aids"]
        if isinstance(visual_aids, BaseException):
            raise visual_aids
        await lesson_service.set_visual_aids(lesson.id, visual_aids)
        lesson.visual_aids = visual_aids
        lesson.auto_enriched = True

    if needs_videos:
        videos = outcomes["videos"]
        if isinstance(videos, BaseException):
            # Don't mark videos_enriched here — leaves it eligible for retry next time
            # the lesson is opened, instead of permanently stuck with an empty list.
            logger.warning(
                "Video discovery failed, will retry on next open: lesson_id=%s error=%s",
                lesson.id,
                videos,
            )
        else:
            await lesson_service.set_videos(lesson.id, videos)
            lesson.videos = videos
            lesson.videos_enriched = True

    logger.info(
        "Auto-enrichment complete: lesson_id=%s %d videos, %d visual aids in %.1fs",
        lesson.id,
        len(lesson.videos),
        len(lesson.visual_aids),
        time.perf_counter() - start,
    )
    return lesson
