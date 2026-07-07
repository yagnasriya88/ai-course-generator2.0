"""Heuristic post-validator for AI-generated graph JSON. Not a semantic
validator — just defensive cleanup so a single malformed node/edge degrades
the diagram instead of breaking the whole canvas (mirrors mermaid_validator.py's
role for Mermaid output)."""

from app.agents.schemas import DiagramGraphSchema
from app.models.diagram import DiagramEdge, DiagramNode


def clean_graph(graph: DiagramGraphSchema) -> tuple[list[DiagramNode], list[DiagramEdge]]:
    seen_ids: set[str] = set()
    nodes: list[DiagramNode] = []
    for node in graph.nodes:
        if not node.id or not node.label or node.id in seen_ids:
            continue
        seen_ids.add(node.id)
        nodes.append(DiagramNode(id=node.id, label=node.label, group=node.group, description=node.description))

    edges: list[DiagramEdge] = []
    for edge in graph.edges:
        if edge.source not in seen_ids or edge.target not in seen_ids or edge.source == edge.target:
            continue
        edges.append(DiagramEdge(source=edge.source, target=edge.target, label=edge.label))

    return nodes, edges
