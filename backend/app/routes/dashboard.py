from fastapi import APIRouter, Depends

from app.dependencies import get_current_user
from app.models.user import User
from app.services import activity_service, course_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("")
async def get_dashboard(current_user: User = Depends(get_current_user)):
    courses = await course_service.list_courses_for_user(owner_id=current_user.id)
    recent_activity = await activity_service.list_recent_activity(current_user.id, limit=10)
    return {"courses": courses, "recent_activity": recent_activity}
