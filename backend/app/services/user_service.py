from bson import ObjectId
from bson.errors import InvalidId

from app.database import get_database
from app.models.user import User

COLLECTION = "users"


async def create_user(user: User) -> User:
    db = get_database()
    doc = user.model_dump(by_alias=True, exclude={"id"})
    result = await db[COLLECTION].insert_one(doc)
    user.id = str(result.inserted_id)
    return user


async def get_user_by_email(email: str) -> User | None:
    db = get_database()
    doc = await db[COLLECTION].find_one({"email": email.lower()})
    return User(**doc) if doc else None


async def get_user_by_id(user_id: str) -> User | None:
    try:
        object_id = ObjectId(user_id)
    except InvalidId:
        return None
    db = get_database()
    doc = await db[COLLECTION].find_one({"_id": object_id})
    return User(**doc) if doc else None
