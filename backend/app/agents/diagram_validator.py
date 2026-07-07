"""Guardrail agent that runs before diagram generation.

Decides (1) whether the prompt is clear/specific enough to generate a
high-quality diagram, and (2) whether the selected diagram type is the best
fit for the user's intent — mirrors topic_validator.py's approach of leaving
judgment entirely to the LLM rather than keyword/regex rules.
"""

from crewai import Agent, Crew, Task

from app.agents.diagram_types import DIAGRAM_TYPE_NAMES, diagram_type_name
from app.agents.llm import get_llm
from app.agents.schemas import DiagramValidationSchema
from app.models.diagram import DiagramGenerateRequest


def build_diagram_validator_agent() -> Agent:
    return Agent(
        role="Diagram Request Validator",
        goal=(
            "Decide whether a submitted topic and diagram type combination is clear, "
            "specific, and well-matched enough to generate a high-quality diagram."
        ),
        backstory=(
            "You are a visual-communication expert who reviews diagram requests before "
            "they reach the generation pipeline. You reject gibberish and prompts too "
            "vague to turn into a meaningful diagram (e.g. 'Stone'), and you flag when "
            "the user's chosen diagram type doesn't fit their topic (e.g. a Flowchart "
            "for a broad exploratory subject like 'Machine Learning', which suits a Mind "
            "Map better) — but you are generous with anything genuinely specific enough "
            "to visualize."
        ),
        llm=get_llm(temperature=0.2),
        verbose=False,
    )


def _build_validation_task(agent: Agent, request: DiagramGenerateRequest) -> Task:
    selected_name = diagram_type_name(request.diagram_type)
    type_options = ", ".join(DIAGRAM_TYPE_NAMES.values())
    return Task(
        description=(
            f"Evaluate whether this diagram request is valid.\n\n"
            f'Topic: "{request.topic}"\n'
            f"Selected diagram type: {selected_name}\n"
            f"Additional detail: {request.detail or 'not specified'}\n\n"
            "Criteria (use your own judgment — do not rely on keyword matching):\n"
            "1. Is the topic clear and specific enough to generate a high-quality "
            "diagram from (not gibberish, keyboard-mashing, or a single vague word "
            "like 'Stone' with no context)?\n"
            f"2. Is {selected_name} the most appropriate diagram type for this topic, "
            f"among: {type_options}?\n\n"
            "If the topic is invalid, explain why in `reason` and give a concrete "
            "rephrasing suggestion in `suggestion`. If the topic is valid but a "
            "different diagram type would represent it better, set `is_valid` to "
            "false, explain why in `reason`, and set `suggested_type` to the exact "
            "diagram type key that fits best: one of mindmap, flowchart, roadmap, "
            "concept_map, process_diagram. Only set `suggested_type` when "
            "recommending a change; omit it and `suggestion` otherwise."
        ),
        expected_output="A validation verdict with confidence, reason, and optional suggestion/suggested_type.",
        agent=agent,
        output_pydantic=DiagramValidationSchema,
    )


async def validate_diagram_request(request: DiagramGenerateRequest) -> DiagramValidationSchema:
    agent = build_diagram_validator_agent()
    task = _build_validation_task(agent, request)
    crew = Crew(agents=[agent], tasks=[task], verbose=False)
    await crew.kickoff_async()
    return task.output.pydantic
