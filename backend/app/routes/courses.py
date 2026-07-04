from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.agents import quiz_agent
from app.agents.retry import with_retries
from app.dependencies import get_current_user
from app.models.course import Course, CourseGenerateRequest, ModuleOutline
from app.models.user import User
from app.services import course_service, generation_service, lesson_service

router = APIRouter(prefix="/courses", tags=["courses"])


@router.post("/generate")
async def generate_course(
    request: CourseGenerateRequest, current_user: User = Depends(get_current_user)
):
    return await generation_service.generate_course(request, owner_id=current_user.id)


@router.get("")
async def list_courses(current_user: User = Depends(get_current_user)):
    return await course_service.list_courses(owner_id=current_user.id)


@router.get("/{course_id}")
async def get_course(course_id: str, current_user: User = Depends(get_current_user)):
    course = await course_service.get_course(course_id)
    if not course or course.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


async def _require_module(course_id: str, module_id: str, current_user: User) -> tuple[Course, ModuleOutline]:
    course = await course_service.get_course(course_id)
    if not course or course.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Course not found")
    module = next((m for m in course.modules if m.id == module_id), None)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    return course, module


@router.post("/{course_id}/modules/{module_id}/quiz")
async def get_or_generate_module_quiz(
    course_id: str, module_id: str, current_user: User = Depends(get_current_user)
):
    course, module = await _require_module(course_id, module_id, current_user)
    if module.quiz:
        return module.quiz

    completed = set(course.completed_lesson_ids)
    if not module.lessons or any(lesson.id not in completed for lesson in module.lessons):
        raise HTTPException(status_code=400, detail="Complete all lessons in this module first")

    lessons = [await lesson_service.get_lesson(stub.id) for stub in module.lessons]
    lessons = [lesson for lesson in lessons if lesson is not None]
    quiz = await with_retries(quiz_agent.generate_module_quiz, module.title, lessons)
    await course_service.set_module_quiz(course_id, module_id, quiz)
    return quiz


class ModuleQuizSubmission(BaseModel):
    answers: dict[str, str]


@router.post("/{course_id}/modules/{module_id}/quiz/submit")
async def submit_module_quiz(
    course_id: str,
    module_id: str,
    submission: ModuleQuizSubmission,
    current_user: User = Depends(get_current_user),
):
    _, module = await _require_module(course_id, module_id, current_user)
    results = []
    correct_count = 0
    for question in module.quiz:
        submitted = submission.answers.get(question.id, "")
        is_correct = submitted.strip().lower() == question.correct_answer.strip().lower()
        correct_count += int(is_correct)
        results.append(
            {
                "question_id": question.id,
                "correct": is_correct,
                "correct_answer": question.correct_answer,
                "explanation": question.explanation,
            }
        )

    total = len(module.quiz)
    passed = total > 0 and (correct_count / total) >= 0.7
    await course_service.set_module_quiz_result(
        course_id, module_id, completed=passed, score=correct_count, total=total
    )
    return {"score": correct_count, "total": total, "passed": passed, "results": results}
