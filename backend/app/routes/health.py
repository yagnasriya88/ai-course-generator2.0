from fastapi import APIRouter

from app.database import get_database

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
async def health():
    return {"status": "ok"}


@router.get("/db")
async def health_db():
    db = get_database()
    await db.command("ping")
    return {"status": "ok", "database": db.name}
