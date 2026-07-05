"""Guardrail agent that runs before the course-generation pipeline.

Decides only whether a submitted topic is legitimate enough to build a course
from — it never touches course content itself. Judgment is left entirely to
the LLM (no keyword/regex rules) so it generalizes to phrasing the rules
below don't anticipate.
"""

from crewai import Agent, Crew, Task

from app.agents.llm import get_llm
from app.agents.schemas import TopicValidationSchema
from app.models.course import CourseGenerateRequest


def build_topic_validator_agent() -> Agent:
    return Agent(
        role="Course Topic Validator",
        goal=(
            "Decide whether a submitted topic is a legitimate, sufficiently specific, "
            "safe subject for a structured educational course."
        ),
        backstory=(
            "You are a curriculum review gatekeeper. You reject gibberish, requests "
            "too vague to scope into a curriculum (e.g. 'teach me everything'), and "
            "unsafe or inappropriate subjects — but you are generous with anything "
            "genuinely educational, even if niche, narrow, or informally worded."
        ),
        llm=get_llm(temperature=0.2),
        verbose=False,
    )


def _build_validation_task(agent: Agent, request: CourseGenerateRequest) -> Task:
    return Task(
        description=(
            f"Evaluate whether this course request is valid.\n\n"
            f"Topic: {request.topic!r}\n"
            f"Level: {request.level or 'not specified'}\n"
            f"Goals: {request.goals or 'not specified'}\n\n"
            "Criteria (use your own judgment — do not rely on keyword matching):\n"
            "- Is the topic educational and suitable for a structured course?\n"
            "- Is it specific enough to build a curriculum from (not something like "
            "'teach me everything' or 'random stuff')?\n"
            "- Is it safe and appropriate (not asking how to do something harmful, "
            "illegal, or dangerous)?\n"
            "- Is there enough information here to generate high-quality lessons?\n\n"
            "Gibberish, keyboard-mashing, empty-of-meaning strings, and requests with "
            "no real educational subject are invalid. If invalid, include a short, "
            "concrete rephrasing suggestion the user could try instead; omit the "
            "suggestion field entirely if none applies."
        ),
        expected_output="A validation verdict with confidence, reason, and optional rephrasing suggestion.",
        agent=agent,
        output_pydantic=TopicValidationSchema,
    )


async def validate_topic(request: CourseGenerateRequest) -> TopicValidationSchema:
    agent = build_topic_validator_agent()
    task = _build_validation_task(agent, request)
    crew = Crew(agents=[agent], tasks=[task], verbose=False)
    await crew.kickoff_async()
    return task.output.pydantic
