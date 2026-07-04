"""Manual verification script for the Phase 1 persistence layer — no AI involved.

Inserts one course with one module/lesson outline, then a matching fully
enriched Lesson document, so the read routes can be smoke-tested end to end.

Run from backend/: .venv/Scripts/python -m scripts.seed_sample_course
"""

import asyncio

from bson import ObjectId

from app.database import close_mongo_connection, connect_to_mongo
from app.models.course import Course, LessonStub, ModuleOutline
from app.models.lesson import ContentBlock, Lesson, QuizQuestion
from app.services import course_service, lesson_service


SAMPLE_QUIZ = [
    QuizQuestion(
        id=str(ObjectId()),
        type="mcq",
        question="What does useState return?",
        options=["A class", "A tuple of [state, setState]", "A promise", "Nothing"],
        correct_answer="A tuple of [state, setState]",
        explanation="useState returns an array with the current state and a setter function.",
    )
]


async def main():
    connect_to_mongo()

    module_id = str(ObjectId())
    lesson_id = str(ObjectId())

    course = Course(
        title="Intro to React Hooks",
        description="A beginner-friendly tour of React's Hooks API.",
        tags=["react", "frontend", "javascript"],
        level="beginner",
        goals="Understand useState and useEffect",
        study_time="2 hours",
        modules=[
            ModuleOutline(
                id=module_id,
                title="Getting Started with Hooks",
                lessons=[LessonStub(id=lesson_id, title="What is useState?")],
                quiz=SAMPLE_QUIZ,
            )
        ],
    )
    saved_course = await course_service.create_course(course)
    print("Created course:", saved_course.id)

    lesson = Lesson(
        id=lesson_id,
        course_id=saved_course.id,
        module_id=module_id,
        title="What is useState?",
        objectives=["Understand component state", "Use useState in a component"],
        content=[
            ContentBlock(type="heading", text="What is useState?"),
            ContentBlock(
                type="paragraph",
                text="useState lets you add state to function components.",
            ),
            ContentBlock(
                type="code", language="jsx", text="const [count, setCount] = useState(0);"
            ),
        ],
        is_enriched=True,
    )
    saved_lesson = await lesson_service.create_lesson(lesson)
    print("Created lesson:", saved_lesson.id)

    await course_service.mark_lesson_enriched(saved_course.id, module_id, lesson_id)
    print("Marked lesson stub as enriched on the course document")
    print(f"\nVerify with:\n  curl http://127.0.0.1:8000/api/courses/{saved_course.id}")
    print(f"  curl http://127.0.0.1:8000/api/lessons/{saved_lesson.id}")

    close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(main())
