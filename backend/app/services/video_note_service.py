from app.database import get_database
from app.models.video_note import VideoNote

COLLECTION = "video_notes"


async def find_video_note(lesson_id: str, video_url: str) -> VideoNote | None:
    db = get_database()
    doc = await db[COLLECTION].find_one({"lesson_id": lesson_id, "video_url": video_url})
    return VideoNote(**doc) if doc else None


async def create_video_note(note: VideoNote) -> VideoNote:
    db = get_database()
    doc = note.model_dump(by_alias=True, exclude={"id"})
    result = await db[COLLECTION].insert_one(doc)
    note.id = str(result.inserted_id)
    return note
