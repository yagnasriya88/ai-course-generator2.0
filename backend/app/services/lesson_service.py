from bson import ObjectId
from bson.errors import InvalidId

from app.database import get_database
from app.models.lesson import HinglishContent, Lesson, VideoRecommendation, VisualAid

COLLECTION = "lessons"


async def create_lesson(lesson: Lesson) -> Lesson:
    """If lesson.id is pre-set, it's inserted as-is so it matches the course's
    embedded lesson-stub id (allocated up front at outline-generation time)."""
    db = get_database()
    doc = lesson.model_dump(by_alias=True, exclude={"id"})
    if lesson.id:
        doc["_id"] = ObjectId(lesson.id)
    result = await db[COLLECTION].insert_one(doc)
    lesson.id = str(result.inserted_id)
    return lesson


async def get_lesson(lesson_id: str) -> Lesson | None:
    try:
        object_id = ObjectId(lesson_id)
    except InvalidId:
        return None
    db = get_database()
    doc = await db[COLLECTION].find_one({"_id": object_id})
    return Lesson(**doc) if doc else None


async def find_lesson_by_stub(course_id: str, module_id: str, lesson_stub_id: str) -> Lesson | None:
    """Lesson stubs (in the Course doc) and full Lesson docs share the same ObjectId."""
    return await get_lesson(lesson_stub_id)


async def set_visual_aids(lesson_id: str, aids: list[VisualAid]) -> None:
    db = get_database()
    await db[COLLECTION].update_one(
        {"_id": ObjectId(lesson_id)},
        {"$set": {"visual_aids": [a.model_dump() for a in aids]}},
    )


async def set_videos(lesson_id: str, videos: list[VideoRecommendation]) -> None:
    db = get_database()
    await db[COLLECTION].update_one(
        {"_id": ObjectId(lesson_id)},
        {"$set": {"videos": [v.model_dump() for v in videos]}},
    )


async def set_hinglish(lesson_id: str, hinglish: HinglishContent) -> None:
    db = get_database()
    await db[COLLECTION].update_one(
        {"_id": ObjectId(lesson_id)},
        {"$set": {"hinglish": hinglish.model_dump()}},
    )


async def mark_auto_enriched(lesson_id: str) -> None:
    db = get_database()
    await db[COLLECTION].update_one(
        {"_id": ObjectId(lesson_id)},
        {"$set": {"auto_enriched": True}},
    )
