from typing import AsyncIterator

from crewai import Agent, Crew, Task

from app.agents.llm import get_llm
from app.agents.streaming import stream_chat_completion
from app.models.lesson import Lesson

_TUTOR_SYSTEM_PROMPT = (
    "You are a patient, encouraging AI Tutor sitting beside the student while they read a "
    "lesson. Answer using the lesson content as your primary source, add clarifying examples "
    "when helpful, and simplify difficult concepts without being condescending. If the "
    "question goes beyond the lesson, you may add outside knowledge, but say so. Keep the "
    "answer focused and conversational."
)


def build_tutor_agent() -> Agent:
    return Agent(
        role="AI Tutor",
        goal="Answer student questions about a lesson clearly, grounded in the lesson's actual content.",
        backstory=(
            "You are a patient, encouraging tutor sitting beside the student while they "
            "read a lesson. You answer questions using the lesson content as your primary "
            "source, add clarifying examples when helpful, and simplify difficult concepts "
            "without being condescending."
        ),
        llm=get_llm(temperature=0.6),
        verbose=False,
    )


def _lesson_text_summary(lesson: Lesson) -> str:
    lines = [f"Lesson: {lesson.title}", "Objectives: " + "; ".join(lesson.objectives)]
    for block in lesson.content:
        text = block.model_dump().get("text")
        if text:
            lines.append(text)
    return "\n".join(lines)


def _build_tutor_task(agent: Agent, lesson: Lesson, question: str) -> Task:
    return Task(
        description=(
            "Here is the lesson content the student is currently viewing:\n\n"
            f"{_lesson_text_summary(lesson)}\n\n"
            f'The student asks: "{question}"\n\n'
            "Answer using the lesson content as your primary source. If the question goes "
            "beyond the lesson, you may add outside knowledge, but say so. Keep the answer "
            "focused and conversational."
        ),
        expected_output="A clear, helpful answer to the student's question.",
        agent=agent,
    )


async def ask_tutor(lesson: Lesson, question: str) -> str:
    agent = build_tutor_agent()
    task = _build_tutor_task(agent, lesson, question)
    crew = Crew(agents=[agent], tasks=[task], verbose=False)
    result = await crew.kickoff_async()
    return str(result)


async def stream_tutor_answer(lesson: Lesson, question: str) -> AsyncIterator[str]:
    """Same prompt shape as ask_tutor, but calls the LLM directly instead of
    going through CrewAI's Agent/Crew, which can't stream."""
    user_prompt = (
        "Here is the lesson content the student is currently viewing:\n\n"
        f"{_lesson_text_summary(lesson)}\n\n"
        f'The student asks: "{question}"'
    )
    async for delta in stream_chat_completion(_TUTOR_SYSTEM_PROMPT, user_prompt, temperature=0.6):
        yield delta
