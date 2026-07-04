from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import settings

_client: AsyncIOMotorClient | None = None


def connect_to_mongo() -> None:
    global _client
    _client = AsyncIOMotorClient(settings.mongo_uri)


def close_mongo_connection() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None


def get_database() -> AsyncIOMotorDatabase:
    if _client is None:
        raise RuntimeError("MongoDB client is not initialized")
    return _client[settings.mongo_db_name]


async def ensure_indexes() -> None:
    db = get_database()
    await db["users"].create_index("email", unique=True)
