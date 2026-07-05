from app.database import get_database
from app.models.activity import ActivityEntry

COLLECTION = "activity_log"


async def log_activity(entry: ActivityEntry) -> ActivityEntry:
    db = get_database()
    doc = entry.model_dump(by_alias=True, exclude={"id"})
    result = await db[COLLECTION].insert_one(doc)
    entry.id = str(result.inserted_id)
    return entry


async def list_recent_activity(user_id: str, limit: int = 10) -> list[ActivityEntry]:
    db = get_database()
    cursor = (
        db[COLLECTION]
        .find({"user_id": user_id})
        .sort("completed_at", -1)
        .limit(limit)
    )
    return [ActivityEntry(**doc) async for doc in cursor]
