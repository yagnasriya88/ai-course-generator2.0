import logging
import time

from app.agents import graph_agent, prompt_refiner
from app.agents.diagram_types import diagram_type_name
from app.agents.graph_validator import clean_graph
from app.agents.retry import with_retries
from app.models.diagram import DiagramGenerateRequest, KnowledgeCanvas
from app.services import diagram_service
from app.services.cache import AsyncTTLCache, cache_key

logger = logging.getLogger(__name__)

# Caches the expensive two-LLM-call pipeline (prompt refine + graph gen) for
# an identical (topic, diagram_type, detail) request — each request still gets
# its own saved KnowledgeCanvas document via create_canvas below, only the
# generation itself is deduped.
_generation_cache = AsyncTTLCache(maxsize=128, ttl=12 * 60 * 60)


async def generate_diagram(request: DiagramGenerateRequest, owner_id: str) -> KnowledgeCanvas:
    start = time.perf_counter()
    logger.info(
        "Diagram generation started: topic=%r type=%r", request.topic, request.diagram_type
    )

    key = cache_key(request.topic, request.diagram_type, request.detail or "")
    cached = _generation_cache.get(key)
    if cached is not None:
        title, nodes, edges = cached
        logger.info("Diagram generation served from cache: topic=%r", request.topic)
    else:
        refined = await with_retries(prompt_refiner.refine_prompt, request)
        logger.info("Diagram prompt refined: %r -> %r", request.topic, refined.refined_prompt)
        enriched_request = request.model_copy(
            update={"topic": refined.refined_prompt, "detail": None}
        )

        graph = await with_retries(graph_agent.generate_graph, enriched_request)
        nodes, edges = clean_graph(graph)
        title = graph.title or f"{diagram_type_name(request.diagram_type)}: {request.topic}"
        logger.info(
            "Diagram graph ready: %r (%d nodes, %d edges) after %.1fs",
            title,
            len(nodes),
            len(edges),
            time.perf_counter() - start,
        )
        _generation_cache.set(key, (title, nodes, edges))

    canvas = KnowledgeCanvas(
        owner_id=owner_id,
        title=title,
        diagram_type=request.diagram_type,
        source_topic=request.topic,
        nodes=[node.model_copy() for node in nodes],
        edges=[edge.model_copy() for edge in edges],
    )
    saved_canvas = await diagram_service.create_canvas(canvas)

    logger.info(
        "Diagram generation complete: id=%s in %.1fs", saved_canvas.id, time.perf_counter() - start
    )
    return saved_canvas
