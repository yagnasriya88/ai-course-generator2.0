import asyncio

from crewai import Agent, Crew, Task

from app.agents.llm import get_llm
from app.agents.schemas import ModuleLessonsSchema


def build_module_generator_agent() -> Agent:
    return Agent(
        role="Module Generator",
        goal="Produce a complete, well-structured set of lessons for a single course module.",
        backstory=(
            "You are an instructional designer who writes clear, practical lesson content: "
            "explanations, real examples, exercises, and key takeaways. You only include a "
            "code block when the module topic genuinely involves code."
        ),
        llm=get_llm(temperature=0.7),
        verbose=False,
    )


def _build_module_task(
    agent: Agent,
    course_title: str,
    course_description: str,
    module_title: str,
    level: str | None,
    goals: str | None,
) -> Task:
    return Task(
        description=(
            f"Course: '{course_title}' — {course_description}\n"
            f"Module: '{module_title}'\n"
            f"Learner level: {level or 'not specified'}. Learner goals: {goals or 'not specified'}.\n\n"
            "Generate 4-5 lessons for this module. For each lesson provide:\n"
            "- a clear, specific title\n"
            "- 2-4 learning objectives\n"
            "- content as an ordered list of typed blocks: 'heading', 'paragraph', 'code' "
            "(only if genuinely relevant — include a 'language' field), 'exercise', and a "
            "final 'takeaway' block summarizing the lesson.\n"
            "Do not include quizzes or videos — those are generated separately."
        ),
        expected_output="A list of 4-5 fully structured lessons for this module.",
        agent=agent,
        output_pydantic=ModuleLessonsSchema,
    )


async def generate_module_lessons(
    course_title: str,
    course_description: str,
    module_title: str,
    level: str | None,
    goals: str | None,
) -> ModuleLessonsSchema:
    agent = build_module_generator_agent()
    task = _build_module_task(agent, course_title, course_description, module_title, level, goals)
    crew = Crew(agents=[agent], tasks=[task], verbose=False)
    await crew.kickoff_async()
    return task.output.pydantic


async def generate_all_modules_concurrently(
    course_title: str,
    course_description: str,
    module_titles: list[str],
    level: str | None,
    goals: str | None,
) -> list[ModuleLessonsSchema]:
    """One Module Generator Agent per module, run concurrently — this is the
    concurrency lever that keeps total course generation time down."""
    results = await asyncio.gather(
        *(
            generate_module_lessons(course_title, course_description, title, level, goals)
            for title in module_titles
        )
    )
    return list(results)
