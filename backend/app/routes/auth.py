from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_current_user
from app.models.user import User, UserLoginRequest, UserSignupRequest, level_progress
from app.services import auth_service, course_service, lesson_service, user_service, video_note_service

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


@router.post("/signup")
async def signup(request: UserSignupRequest):
    if await user_service.get_user_by_email(request.email):
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    user = User(
        name=request.name,
        email=request.email,
        password_hash=auth_service.hash_password(request.password),
    )
    saved = await user_service.create_user(user)
    saved = await user_service.bump_streak(saved.id) or saved
    token = auth_service.create_access_token(saved.id)
    return {"access_token": token, "user": _public(saved)}


@router.post("/login")
async def login(request: UserLoginRequest):
    user = await user_service.get_user_by_email(request.email)
    if not user or not auth_service.verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user = await user_service.bump_streak(user.id) or user
    token = auth_service.create_access_token(user.id)
    return {"access_token": token, "user": _public(user)}


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
