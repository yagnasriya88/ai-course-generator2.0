import logging
import time

from app.agents import graph_agent, prompt_refiner
from app.agents.diagram_types import diagram_type_name
from app.agents.graph_validator import clean_graph
from app.agents.retry import with_retries
from app.models.diagram import DiagramGenerateRequest, KnowledgeCanvas
from app.services import diagram_service

logger = logging.getLogger(__name__)


async def generate_diagram(request: DiagramGenerateRequest, owner_id: str) -> KnowledgeCanvas:
    start = time.perf_counter()
    logger.info(
        "Diagram generation started: topic=%r type=%r", request.topic, request.diagram_type
    )

    refined = await with_retries(prompt_refiner.refine_prompt, request)
    logger.info("Diagram prompt refined: %r -> %r", request.topic, refined.refined_prompt)
    enriched_request = request.model_copy(update={"topic": refined.refined_prompt, "detail": None})

    graph = await with_retries(graph_agent.generate_graph, enriched_request)
    nodes, edges = clean_graph(graph)
    logger.info(
        "Diagram graph ready: %r (%d nodes, %d edges) after %.1fs",
        graph.title,
        len(nodes),
        len(edges),
        time.perf_counter() - start,
    )

    canvas = KnowledgeCanvas(
        owner_id=owner_id,
        title=graph.title or f"{diagram_type_name(request.diagram_type)}: {request.topic}",
        diagram_type=request.diagram_type,
        source_topic=request.topic,
        nodes=nodes,
        edges=edges,
    )
    saved_canvas = await diagram_service.create_canvas(canvas)

    logger.info(
        "Diagram generation complete: id=%s in %.1fs", saved_canvas.id, time.perf_counter() - start
    )
    return saved_canvas
