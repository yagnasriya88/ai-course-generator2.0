import logging
import time

from bson import ObjectId

from app.agents import image_agent
from app.agents.course_planner import generate_course_outline
from app.agents.module_generator import generate_all_modules_concurrently
from app.agents.retry import with_retries
from app.models.course import Course, CourseGenerateRequest, LessonStub, ModuleOutline
from app.models.lesson import ContentBlock, Lesson
from app.services import course_service, lesson_service

logger = logging.getLogger(__name__)


def _build_content_blocks(blocks) -> list[ContentBlock]:
    """Schema-level validation (LessonContentBlockSchema) should already reject
    malformed block types, but this is kept as a last line of defense — one bad
    block degrades a lesson instead of crashing the whole course."""
    built = []
    for block in blocks:
        try:
            built.append(ContentBlock(**block.model_dump()))
        except Exception:
            logger.warning("Dropping malformed content block: %r", block, exc_info=True)
    return built


async def generate_course(
    request: CourseGenerateRequest,
    owner_id: str,
    is_platform: bool = False,
    source_topic: str | None = None,
) -> Course:
    start = time.perf_counter()
    logger.info("Course generation started: topic=%r level=%r", request.topic, request.level)

    outline = await with_retries(generate_course_outline, request)
    logger.info(
        "Course outline ready: %r (%d modules) after %.1fs",
        outline.title,
        len(outline.modules),
        time.perf_counter() - start,
    )

    module_titles = [m.title for m in outline.modules]
    module_results = await with_retries(
        generate_all_modules_concurrently,
        outline.title,
        outline.description,
        module_titles,
        request.level,
        request.goals,
    )
    logger.info(
        "%d modules generated concurrently after %.1fs total",
        len(module_results),
        time.perf_counter() - start,
    )

    modules: list[ModuleOutline] = []
    lessons_to_save: list[Lesson] = []

    for module_title, module_result in zip(module_titles, module_results):
        module_id = str(ObjectId())
        lesson_stubs: list[LessonStub] = []

        for generated_lesson in module_result.lessons:
            lesson_id = str(ObjectId())
            lesson_stubs.append(
                LessonStub(id=lesson_id, title=generated_lesson.title, is_enriched=True)
            )
            lessons_to_save.append(
                Lesson(
                    id=lesson_id,
                    course_id="",  # filled in once the course is saved and has an id
                    module_id=module_id,
                    title=generated_lesson.title,
                    objectives=generated_lesson.objectives,
                    content=_build_content_blocks(generated_lesson.content),
                    is_enriched=True,
                )
            )

        modules.append(ModuleOutline(id=module_id, title=module_title, lessons=lesson_stubs))

    try:
        cover_image_url = await image_agent.discover_topic_image(outline.title, outline.description)
    except Exception:
        logger.warning("Cover image discovery failed for %r", outline.title, exc_info=True)
        cover_image_url = None

    course = Course(
        owner_id=owner_id,
        title=outline.title,
        description=outline.description,
        tags=outline.tags,
        level=request.level,
        goals=request.goals,
        study_time=request.study_time,
        modules=modules,
        cover_image_url=cover_image_url,
        is_platform=is_platform,
        source_topic=source_topic,
    )
    saved_course = await course_service.create_course(course)

    for lesson in lessons_to_save:
        lesson.course_id = saved_course.id
        await lesson_service.create_lesson(lesson)

    logger.info(
        "Course generation complete: id=%s %d lessons in %.1fs",
        saved_course.id,
        len(lessons_to_save),
        time.perf_counter() - start,
    )
    return saved_course
