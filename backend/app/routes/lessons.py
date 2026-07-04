from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.agents import hinglish_agent, tutor_agent, video_agent, visual_agent
from app.agents.retry import with_retries
from app.dependencies import get_current_user
from app.models.user import User
from app.services import course_service, enrichment_service, lesson_service, video_note_service

router = APIRouter(prefix="/lessons", tags=["lessons"])


async def _require_lesson(lesson_id: str, current_user: User):
    lesson = await lesson_service.get_lesson(lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    course = await course_service.get_course(lesson.course_id)
    if not course or course.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson


@router.get("/{lesson_id}")
async def get_lesson(lesson_id: str, current_user: User = Depends(get_current_user)):
    lesson = await _require_lesson(lesson_id, current_user)
    if not lesson.auto_enriched:
        lesson = await enrichment_service.auto_enrich_lesson(lesson)
    return lesson


@router.post("/{lesson_id}/visuals/generate")
async def generate_visuals(lesson_id: str, current_user: User = Depends(get_current_user)):
    lesson = await _require_lesson(lesson_id, current_user)
    aids = await with_retries(visual_agent.generate_visual_aids, lesson)
    await lesson_service.set_visual_aids(lesson_id, aids)
    return aids


@router.post("/{lesson_id}/videos/discover")
async def discover_videos(lesson_id: str, current_user: User = Depends(get_current_user)):
    lesson = await _require_lesson(lesson_id, current_user)
    videos = await with_retries(video_agent.discover_videos, lesson)
    await lesson_service.set_videos(lesson_id, videos)
    return videos


class VideoNotesRequest(BaseModel):
    video_url: str


@router.post("/{lesson_id}/videos/notes")
async def video_notes(
    lesson_id: str, body: VideoNotesRequest, current_user: User = Depends(get_current_user)
):
    lesson = await _require_lesson(lesson_id, current_user)
    existing = await video_note_service.find_video_note(lesson_id, body.video_url)
    if existing:
        return existing
    note = await with_retries(
        video_agent.generate_video_notes, lesson_id, body.video_url, lesson.title
    )
    return await video_note_service.create_video_note(note)


class LessonCompletion(BaseModel):
    completed: bool


@router.post("/{lesson_id}/complete")
async def set_lesson_completed(
    lesson_id: str, body: LessonCompletion, current_user: User = Depends(get_current_user)
):
    lesson = await _require_lesson(lesson_id, current_user)
    completed_lesson_ids = await course_service.set_lesson_completed(
        lesson.course_id, lesson_id, body.completed
    )
    return {"completed_lesson_ids": completed_lesson_ids}


@router.post("/{lesson_id}/hinglish")
async def generate_hinglish(lesson_id: str, current_user: User = Depends(get_current_user)):
    lesson = await _require_lesson(lesson_id, current_user)
    hinglish = await with_retries(hinglish_agent.generate_hinglish_content, lesson)
    await lesson_service.set_hinglish(lesson_id, hinglish)
    return hinglish


class TutorQuestion(BaseModel):
    question: str


@router.post("/{lesson_id}/tutor/ask")
async def tutor_ask(
    lesson_id: str, body: TutorQuestion, current_user: User = Depends(get_current_user)
):
    lesson = await _require_lesson(lesson_id, current_user)
    answer = await with_retries(tutor_agent.ask_tutor, lesson, body.question)
    return {"answer": answer}
