"""UI-verification fixture — inserts a fully-enriched course/lesson directly into
MongoDB (no Gemini calls), so the frontend can be screenshot-tested without
burning API quota. Not part of the app; dev-only tooling.

Run from backend/: .venv/Scripts/python -m scripts.seed_rich_lesson
"""

import asyncio

from bson import ObjectId

from app.database import close_mongo_connection, connect_to_mongo
from app.models.course import Course, LessonStub, ModuleOutline
from app.models.lesson import (
    ContentBlock,
    HinglishContent,
    Lesson,
    QuizQuestion,
    VideoRecommendation,
    VisualAid,
)
from app.services import course_service, lesson_service


async def main():
    connect_to_mongo()

    module_id = str(ObjectId())
    lesson_id = str(ObjectId())

    course = Course(
        title="Intro to React Hooks",
        description="A beginner-friendly tour of React's Hooks API, from useState to custom hooks.",
        tags=["react", "frontend", "javascript"],
        level="beginner",
        goals="Understand useState and useEffect",
        study_time="2 hours",
        modules=[
            ModuleOutline(
                id=module_id,
                title="Getting Started with Hooks",
                lessons=[
                    LessonStub(id=lesson_id, title="What is useState?", is_enriched=True),
                    LessonStub(id=str(ObjectId()), title="Managing Side Effects with useEffect"),
                    LessonStub(id=str(ObjectId()), title="Building Your First Custom Hook"),
                ],
                quiz=[
                    QuizQuestion(
                        id=str(ObjectId()),
                        type="mcq",
                        question="What does useState return?",
                        options=[
                            "A class",
                            "A tuple of [state, setState]",
                            "A promise",
                            "Nothing",
                        ],
                        correct_answer="A tuple of [state, setState]",
                        explanation=(
                            "useState returns an array with the current state and a setter "
                            "function."
                        ),
                    ),
                    QuizQuestion(
                        id=str(ObjectId()),
                        type="true_false",
                        question="useState can only be used in class components.",
                        options=["True", "False"],
                        correct_answer="False",
                        explanation="useState is a Hook — Hooks only work in function components.",
                    ),
                ],
            )
        ],
    )
    saved_course = await course_service.create_course(course)

    lesson = Lesson(
        id=lesson_id,
        course_id=saved_course.id,
        module_id=module_id,
        title="What is useState?",
        objectives=[
            "Understand what component state is and why it matters",
            "Use useState to add state to a function component",
            "Update state correctly using the setter function",
        ],
        content=[
            ContentBlock(type="heading", text="What is useState?"),
            ContentBlock(
                type="paragraph",
                text=(
                    "Imagine a physical dictionary — you look up a **word** (key) and find its "
                    "**definition** (value). React's `useState` works similarly: it lets you "
                    "attach a piece of state to a function component."
                ),
            ),
            ContentBlock(
                type="code",
                language="jsx",
                text="const [count, setCount] = useState(0);\n\nfunction increment() {\n  setCount(count + 1);\n}",
            ),
            ContentBlock(
                type="exercise",
                text="Try adding a second piece of state to track whether a light is on or off.",
            ),
            ContentBlock(
                type="takeaway",
                text="`useState` returns a `[value, setter]` pair — call the setter to trigger a re-render with the new value.",
            ),
        ],
        videos=[
            VideoRecommendation(
                title="Learn useState in 10 Minutes | Beginners React Hooks Tutorial",
                url="https://www.youtube.com/watch?v=2wKS55_rkqI",
                query="What is useState?",
            ),
            VideoRecommendation(
                title="React useState() hook introduction",
                url="https://www.youtube.com/watch?v=SpDG283b4bw",
                query="What is useState?",
            ),
        ],
        visual_aids=[
            VisualAid(
                type="mindmap",
                title="Understanding useState",
                data={
                    "mermaid": (
                        "mindmap\n  root((useState))\n    Purpose\n      Add state to a component\n"
                        "    Returns\n      Current value\n      A setter function\n"
                        "    Rules\n      Only call at the top level\n      Only call in function components"
                    )
                },
            )
        ],
        hinglish=HinglishContent(
            text=(
                "Toh dekho, `useState` na, React mein ek bahut hi important 'hook' hai. Simple "
                "bhasha mein samjho toh, yeh aapke function components ko 'state' add karne ki "
                "power deta hai."
            ),
            audio_base64=None,
        ),
        is_enriched=True,
        auto_enriched=True,
    )
    saved_lesson = await lesson_service.create_lesson(lesson)

    print("Course:", saved_course.id)
    print("Lesson:", saved_lesson.id)
    print(f"\nOpen: http://localhost:5173/course/{saved_course.id}")
    print(f"Open: http://localhost:5173/course/{saved_course.id}/lesson/{saved_lesson.id}")

    close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(main())
