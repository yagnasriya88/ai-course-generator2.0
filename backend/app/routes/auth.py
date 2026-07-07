from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.dependencies import get_current_user
from app.models.user import User, level_progress
from app.services import course_service, lesson_service, user_service, video_note_service

router = APIRouter(prefix="/auth", tags=["auth"])


def _public(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "xp": user.xp,
        "gold": user.gold,
        "current_streak": user.current_streak,
        "longest_streak": user.longest_streak,
        **level_progress(user.xp),
    }


@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    current_user = await user_service.bump_streak(current_user.id) or current_user
    return _public(current_user)


@router.get("/me/export")
async def export_my_data(current_user: User = Depends(get_current_user)):
    courses = await course_service.list_courses(current_user.id, limit=1000)
    lessons = await lesson_service.list_lessons_by_course_ids([c.id for c in courses])
    video_notes = await video_note_service.find_video_notes_by_lesson_ids([l.id for l in lessons])
    return {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "user": _public(current_user),
        "courses": [c.model_dump(mode="json") for c in courses],
        "lessons": [l.model_dump(mode="json") for l in lessons],
        "video_notes": [n.model_dump(mode="json") for n in video_notes],
    }
