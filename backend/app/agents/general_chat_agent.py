from typing import AsyncIterator

from crewai import Agent, Crew, Task

from app.agents.llm import get_llm
from app.agents.streaming import stream_chat_completion

_GENERAL_CHAT_SYSTEM_PROMPT = (
    "You are a friendly, knowledgeable learning assistant available anywhere in the app — "
    "not grounded in any specific lesson. Give clear, accurate, encouraging answers, and say "
    "so when a question needs more context than you have."
)


def build_general_chat_agent() -> Agent:
    return Agent(
        role="Learning Assistant",
        goal="Answer a student's question clearly and helpfully, on any topic.",
        backstory=(
            "You are a friendly, knowledgeable learning assistant available anywhere in the "
            "app — not grounded in any specific lesson. You give clear, accurate, encouraging "
            "answers, and say so when a question needs more context than you have."
        ),
        llm=get_llm(temperature=0.6),
        verbose=False,
    )


def _build_chat_task(agent: Agent, question: str) -> Task:
    return Task(
        description=f'The student asks: "{question}"\n\nAnswer clearly and helpfully.',
        expected_output="A clear, helpful answer to the student's question.",
        agent=agent,
    )


async def ask_general(question: str) -> str:
    agent = build_general_chat_agent()
    task = _build_chat_task(agent, question)
    crew = Crew(agents=[agent], tasks=[task], verbose=False)
    result = await crew.kickoff_async()
    return str(result)


async def stream_general_answer(question: str) -> AsyncIterator[str]:
    """Same prompt shape as ask_general, but calls the LLM directly instead of
    going through CrewAI's Agent/Crew, which can't stream."""
    async for delta in stream_chat_completion(_GENERAL_CHAT_SYSTEM_PROMPT, question, temperature=0.6):
        yield delta
