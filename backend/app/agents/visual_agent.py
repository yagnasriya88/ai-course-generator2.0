import logging

from crewai import Agent, Crew, Task

from app.agents.llm import get_llm
from app.agents.mermaid_validator import validate_mermaid
from app.agents.schemas import VisualAidsSchema
from app.models.lesson import Lesson, VisualAid

logger = logging.getLogger(__name__)


def build_visual_agent() -> Agent:
    return Agent(
        role="Visual Learning Agent",
        goal="Turn lesson content into visual learning aids that make complex ideas easier to grasp.",
        backstory=(
            "You are a visual thinker who converts explanations into mind maps, flowcharts, "
            "and diagrams using Mermaid syntax, choosing whichever diagram type best fits "
            "the material."
        ),
        llm=get_llm(temperature=0.5),
        verbose=False,
    )


def _lesson_text_summary(lesson: Lesson) -> str:
    lines = [f"Lesson: {lesson.title}"]
    for block in lesson.content:
        text = block.model_dump().get("text")
        if text:
            lines.append(text)
    return "\n".join(lines)


def _build_visual_task(agent: Agent, lesson: Lesson) -> Task:
    return Task(
        description=(
            "Based on the following lesson content, generate 1-2 visual learning aids that "
            "would help a student understand it faster.\n\n"
            f"{_lesson_text_summary(lesson)}\n\n"
            "For each aid, choose the most fitting type (mindmap, flowchart, concept_map, "
            "process_diagram, timeline, or comparison_table) and produce valid Mermaid "
            "diagram syntax for it in the 'mermaid' field. Only include an aid if it "
            "genuinely clarifies the lesson — do not force a diagram where one doesn't help.\n\n"
            "Mermaid syntax rules (each breaks the parser if skipped):\n"
            "- flowchart / concept_map / process_diagram / timeline / comparison_table: any "
            'node label containing code, brackets, parentheses, or an equals sign MUST be '
            'wrapped in double quotes, e.g. `A["const [count, setCount] = useState(0)"]`, '
            'never `A[const [count, setCount] = useState(0)]`.\n'
            "- mindmap: quoting does NOT work as an escape here — node labels must avoid "
            "code syntax, brackets, parentheses, and equals signs entirely. Describe the "
            'concept in plain English instead, e.g. "Returns a value and a setter function", '
            'not "const [value, setValue] = useState(initial)". If you need to show actual '
            "code, use a flowchart instead of a mindmap for that aid."
        ),
        expected_output="1-2 visual aids, each with a type, title, and valid Mermaid syntax.",
        agent=agent,
        output_pydantic=VisualAidsSchema,
    )


async def generate_visual_aids(lesson: Lesson) -> list[VisualAid]:
    agent = build_visual_agent()
    task = _build_visual_task(agent, lesson)
    crew = Crew(agents=[agent], tasks=[task], verbose=False)
    await crew.kickoff_async()
    result: VisualAidsSchema = task.output.pydantic
    aids: list[VisualAid] = []
    for aid in result.aids:
        violations = validate_mermaid(aid.type, aid.mermaid)
        if violations:
            logger.warning(
                "Dropping visual aid %r for lesson %s — invalid mermaid syntax: %s",
                aid.title,
                lesson.id,
                violations,
            )
            continue
        aids.append(VisualAid(type=aid.type, title=aid.title, data={"mermaid": aid.mermaid}))
    return aids
