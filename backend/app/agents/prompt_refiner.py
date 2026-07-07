"""Expands a user's raw diagram topic into a more descriptive, diagram-type-
tailored prompt. Runs after the guardrail passes and before graph_agent
generates the graph — produces text only, never graph JSON or frontend
code, so it can't drift from the single generic graph contract that
graph_agent.py owns."""

from crewai import Agent, Crew, Task

from app.agents.diagram_types import DIAGRAM_TYPE_GUIDANCE, diagram_type_name
from app.agents.llm import get_llm
from app.agents.schemas import RefinedPromptSchema
from app.models.diagram import DiagramGenerateRequest


def build_prompt_refiner_agent() -> Agent:
    return Agent(
        role="Diagram Prompt Refiner",
        goal=(
            "Expand a user's short diagram topic into a clear, detailed brief that "
            "gives the graph-generation agent enough structure and context to "
            "produce a high-quality diagram."
        ),
        backstory=(
            "You are an instructional designer who turns terse topics into rich, "
            "well-scoped briefs. You never invent unrelated content or change the "
            "user's intent — you clarify scope, name the key sub-topics, stages, or "
            "branches worth covering, and tailor the framing to the specific diagram "
            "type being generated."
        ),
        llm=get_llm(temperature=0.4),
        verbose=False,
    )


def _build_refine_task(agent: Agent, request: DiagramGenerateRequest) -> Task:
    type_name = diagram_type_name(request.diagram_type)
    guidance = DIAGRAM_TYPE_GUIDANCE.get(request.diagram_type, "")
    detail_line = f"\nAdditional detail from the user: {request.detail}" if request.detail else ""
    return Task(
        description=(
            f'A user wants to generate a {type_name} for the topic: "{request.topic}".'
            f"{detail_line}\n\n"
            f"{guidance}\n\n"
            "Rewrite this into a single expanded, descriptive prompt (3-6 sentences) "
            f"that: names the specific sub-topics, stages, or branches this {type_name} "
            "should cover, clarifies any ambiguous scope, and folds in the user's "
            "additional detail if given. Do not invent an unrelated subject — stay "
            "faithful to the user's original topic and intent."
        ),
        expected_output=f"An expanded, descriptive prompt tailored for generating a {type_name}.",
        agent=agent,
        output_pydantic=RefinedPromptSchema,
    )


async def refine_prompt(request: DiagramGenerateRequest) -> RefinedPromptSchema:
    agent = build_prompt_refiner_agent()
    task = _build_refine_task(agent, request)
    crew = Crew(agents=[agent], tasks=[task], verbose=False)
    await crew.kickoff_async()
    return task.output.pydantic
