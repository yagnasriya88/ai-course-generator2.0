from crewai import Agent, Crew, Task

from app.agents.llm import get_llm
from app.agents.schemas import CourseOutlineSchema
from app.models.course import CourseGenerateRequest


def build_course_planner_agent() -> Agent:
    return Agent(
        role="Course Planner",
        goal="Design a well-scoped, progressively structured course roadmap for a given topic.",
        backstory=(
            "You are a curriculum designer who breaks any topic into a logical learning "
            "path, moving from foundational to advanced concepts, tailored to the "
            "learner's stated level, goals, and available time."
        ),
        llm=get_llm(temperature=0.6),
        verbose=False,
    )


def _build_outline_task(agent: Agent, request: CourseGenerateRequest) -> Task:
    return Task(
        description=(
            f"Design a course roadmap for the topic: '{request.topic}'.\n"
            f"Learner level: {request.level or 'not specified'}.\n"
            f"Learner goals: {request.goals or 'not specified'}.\n"
            f"Available study time: {request.study_time or 'not specified'}.\n\n"
            "Produce a course title, a 2-3 sentence description, 3-6 relevant tags, "
            "and 3-6 modules ordered from foundational to advanced. Only produce module "
            "titles at this stage — lessons are generated separately, per module."
        ),
        expected_output="A course title, description, tags, and an ordered list of module titles.",
        agent=agent,
        output_pydantic=CourseOutlineSchema,
    )


async def generate_course_outline(request: CourseGenerateRequest) -> CourseOutlineSchema:
    agent = build_course_planner_agent()
    task = _build_outline_task(agent, request)
    crew = Crew(agents=[agent], tasks=[task], verbose=False)
    await crew.kickoff_async()
    return task.output.pydantic
