"""Generates and edits the generic {nodes, edges} graph that backs every
Knowledge Canvas diagram. This agent's sole responsibility is producing/editing
graph JSON — it must never emit frontend code; rendering is entirely the
client's job (React Flow + ELK.js layout)."""

from crewai import Agent, Crew, Task

from app.agents.diagram_types import DIAGRAM_TYPE_GUIDANCE, diagram_type_name
from app.agents.llm import get_llm
from app.agents.schemas import DiagramGraphSchema
from app.models.diagram import DiagramEdge, DiagramGenerateRequest, DiagramNode


def build_graph_agent() -> Agent:
    return Agent(
        role="Knowledge Graph Agent",
        goal="Produce and edit clear, well-organized diagram graphs as structured node/edge JSON.",
        backstory=(
            "You are a visual knowledge architect. You never write frontend code or "
            "diagram-library syntax — you only ever produce or modify a generic graph "
            "of nodes and edges, which a separate rendering system turns into a visual "
            "diagram. You organize topics into clear, well-labeled structures suited to "
            "the requested diagram type."
        ),
        llm=get_llm(temperature=0.5),
        verbose=False,
    )


def _build_generate_task(agent: Agent, request: DiagramGenerateRequest) -> Task:
    type_name = diagram_type_name(request.diagram_type)
    guidance = DIAGRAM_TYPE_GUIDANCE.get(request.diagram_type, "")
    detail_line = f"\nAdditional detail: {request.detail}" if request.detail else ""
    return Task(
        description=(
            f'Generate a {type_name} for the following topic: "{request.topic}".{detail_line}\n\n'
            f"{guidance}\n\n"
            "Produce 6-16 nodes with short, clear labels (a few words each, not full "
            "sentences) and enough edges to show how they connect. Every edge's `source` "
            "and `target` must reference an `id` of a node you produced. Give the whole "
            "graph a concise `title`."
        ),
        expected_output=f"A {type_name} graph with a title, nodes, and edges.",
        agent=agent,
        output_pydantic=DiagramGraphSchema,
    )


async def generate_graph(request: DiagramGenerateRequest) -> DiagramGraphSchema:
    agent = build_graph_agent()
    task = _build_generate_task(agent, request)
    crew = Crew(agents=[agent], tasks=[task], verbose=False)
    await crew.kickoff_async()
    return task.output.pydantic


def _graph_to_text(nodes: list[DiagramNode], edges: list[DiagramEdge]) -> str:
    node_lines = [f"- {n.id}: {n.label}" + (f" (group: {n.group})" if n.group else "") for n in nodes]
    edge_lines = [f"- {e.source} -> {e.target}" + (f" ({e.label})" if e.label else "") for e in edges]
    return "Nodes:\n" + "\n".join(node_lines) + "\n\nEdges:\n" + "\n".join(edge_lines)


def _build_edit_task(
    agent: Agent, nodes: list[DiagramNode], edges: list[DiagramEdge], instruction: str, diagram_type: str
) -> Task:
    type_name = diagram_type_name(diagram_type)
    return Task(
        description=(
            f"The user is editing an existing {type_name} using this instruction: "
            f'"{instruction}"\n\n'
            "Current graph:\n"
            f"{_graph_to_text(nodes, edges)}\n\n"
            "Apply the instruction and return the COMPLETE resulting graph (not just "
            "the changed part) — all unaffected nodes and edges must still be present "
            "unless the instruction asked to remove them. Reuse existing node ids for "
            "nodes you keep; invent new short ids for any new nodes. Every edge's "
            "`source`/`target` must reference an id present in your returned `nodes`."
        ),
        expected_output=f"The complete updated {type_name} graph with a title, nodes, and edges.",
        agent=agent,
        output_pydantic=DiagramGraphSchema,
    )


async def edit_graph(
    nodes: list[DiagramNode], edges: list[DiagramEdge], instruction: str, diagram_type: str
) -> DiagramGraphSchema:
    agent = build_graph_agent()
    task = _build_edit_task(agent, nodes, edges, instruction, diagram_type)
    crew = Crew(agents=[agent], tasks=[task], verbose=False)
    await crew.kickoff_async()
    return task.output.pydantic
