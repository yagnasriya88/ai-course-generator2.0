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


async def create_lessons_bulk(lessons: list[Lesson]) -> list[Lesson]:
    """Same _id-preservation contract as create_lesson, but issues one
    insert_many instead of N sequential round-trips — used by course
    generation, which creates every module's lessons in one batch."""
    if not lessons:
        return lessons
    db = get_database()
    docs = []
    for lesson in lessons:
        doc = lesson.model_dump(by_alias=True, exclude={"id"})
        if lesson.id:
            doc["_id"] = ObjectId(lesson.id)
        docs.append(doc)
    result = await db[COLLECTION].insert_many(docs)
    for lesson, inserted_id in zip(lessons, result.inserted_ids):
        lesson.id = str(inserted_id)
    return lessons


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


async def list_lessons_by_course_ids(course_ids: list[str]) -> list[Lesson]:
    if not course_ids:
        return []
    db = get_database()
    cursor = db[COLLECTION].find({"course_id": {"$in": course_ids}})
    return [Lesson(**doc) async for doc in cursor]


async def set_visual_aids(lesson_id: str, aids: list[VisualAid]) -> None:
    db = get_database()
    await db[COLLECTION].update_one(
        {"_id": ObjectId(lesson_id)},
        {"$set": {"visual_aids": [a.model_dump() for a in aids], "auto_enriched": True}},
    )


async def set_videos(lesson_id: str, videos: list[VideoRecommendation]) -> None:
    db = get_database()
    await db[COLLECTION].update_one(
        {"_id": ObjectId(lesson_id)},
        {"$set": {"videos": [v.model_dump() for v in videos], "videos_enriched": True}},
    )


async def set_hinglish(lesson_id: str, hinglish: HinglishContent) -> None:
    db = get_database()
    await db[COLLECTION].update_one(
        {"_id": ObjectId(lesson_id)},
        {"$set": {"hinglish": hinglish.model_dump()}},
    )
