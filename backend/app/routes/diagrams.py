from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse

from app.agents import graph_agent
from app.agents.graph_validator import clean_graph
from app.agents.retry import with_retries
from app.dependencies import get_current_user
from app.models.diagram import DiagramAIEditRequest, DiagramGenerateRequest, DiagramUpdateRequest
from app.models.user import User
from app.services import diagram_guardrail_service, diagram_job_service, diagram_service

router = APIRouter(prefix="/diagrams", tags=["knowledge-canvas"])


@router.post("/generate", status_code=status.HTTP_202_ACCEPTED)
async def generate_diagram(
    request: DiagramGenerateRequest, current_user: User = Depends(get_current_user)
):
    """Validates the topic/diagram-type pair, then hands off to the persistent
    job queue instead of generating inline — same rationale as course
    generation (POST /courses/generate). Clients poll GET /diagrams/jobs/{job_id}."""
    try:
        await diagram_guardrail_service.run_guardrails(request)
    except diagram_guardrail_service.DiagramRejected as exc:
        result = exc.result
        message = f"{result.reason} {result.suggestion}".strip() if result.suggestion else result.reason
        return JSONResponse(
            status_code=422,
            content={
                "detail": message,
                "valid": False,
                "reason": result.reason,
                "suggestion": result.suggestion,
                "suggested_type": result.suggested_type,
            },
        )

    job, created = await diagram_job_service.create_job(owner_id=current_user.id, request=request)
    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED if created else status.HTTP_200_OK,
        content=job.model_dump(mode="json", by_alias=True),
    )


@router.get("/jobs")
async def list_diagram_jobs(current_user: User = Depends(get_current_user)):
    return await diagram_job_service.list_jobs_for_user(owner_id=current_user.id)


@router.get("/jobs/{job_id}")
async def get_diagram_job(job_id: str, current_user: User = Depends(get_current_user)):
    job = await diagram_job_service.get_job(job_id)
    if not job or job.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("")
async def list_diagrams(current_user: User = Depends(get_current_user)):
    return await diagram_service.list_canvases_for_user(owner_id=current_user.id)


@router.get("/{diagram_id}")
async def get_diagram(diagram_id: str, current_user: User = Depends(get_current_user)):
    canvas = await diagram_service.get_canvas(diagram_id)
    if not canvas or canvas.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Diagram not found")
    return canvas


@router.patch("/{diagram_id}")
async def update_diagram(
    diagram_id: str, update: DiagramUpdateRequest, current_user: User = Depends(get_current_user)
):
    canvas = await diagram_service.get_canvas(diagram_id)
    if not canvas or canvas.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Diagram not found")
    return await diagram_service.update_canvas(diagram_id, update)


@router.delete("/{diagram_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_diagram(diagram_id: str, current_user: User = Depends(get_current_user)):
    canvas = await diagram_service.get_canvas(diagram_id)
    if not canvas or canvas.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Diagram not found")
    await diagram_service.delete_canvas(diagram_id)


@router.post("/{diagram_id}/duplicate", status_code=status.HTTP_201_CREATED)
async def duplicate_diagram(diagram_id: str, current_user: User = Depends(get_current_user)):
    canvas = await diagram_service.get_canvas(diagram_id)
    if not canvas or canvas.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Diagram not found")
    return await diagram_service.duplicate_canvas(diagram_id)


@router.post("/{diagram_id}/ai-edit")
async def ai_edit_diagram(
    diagram_id: str, body: DiagramAIEditRequest, current_user: User = Depends(get_current_user)
):
    """Synchronous (not job-queued) — interactive editing is a single short
    LLM call, unlike full generation. The AI only ever returns graph JSON;
    it never generates frontend code."""
    canvas = await diagram_service.get_canvas(diagram_id)
    if not canvas or canvas.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Diagram not found")

    graph = await with_retries(
        graph_agent.edit_graph, canvas.nodes, canvas.edges, body.instruction, canvas.diagram_type
    )
    nodes, edges = clean_graph(graph)
    return await diagram_service.set_graph(diagram_id, nodes, edges)
