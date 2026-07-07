"""In-process background workers draining the diagram_jobs queue — a
dedicated worker set separate from job_worker.py (course generation) so the
two pipelines never contend or risk each other. See job_worker.py for the
underlying design rationale (no Celery/Redis; atomic claim keeps concurrent
workers safe)."""

import asyncio
import logging

from app.models.diagram_job import DiagramJob
from app.services import diagram_generation_service, diagram_job_service

logger = logging.getLogger(__name__)

POLL_INTERVAL_SECONDS = 2.0

_worker_tasks: list[asyncio.Task] = []


async def _process_job(job: DiagramJob) -> None:
    logger.info(
        "Processing diagram job %s (topic=%r, attempt %d/%d)",
        job.id,
        job.request.topic,
        job.attempts,
        job.max_attempts,
    )
    try:
        canvas = await diagram_generation_service.generate_diagram(job.request, owner_id=job.owner_id)
        await diagram_job_service.mark_completed(job.id, canvas.id)
    except Exception as exc:
        can_retry = job.attempts < job.max_attempts
        await diagram_job_service.mark_failed(
            job.id,
            "Something went wrong while generating this diagram. Please try again." if not can_retry else str(exc),
            requeue=can_retry,
        )


async def _worker_loop(worker_id: int) -> None:
    logger.info("Diagram job worker %d started", worker_id)
    while True:
        try:
            job = await diagram_job_service.claim_next_queued_job()
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Diagram worker %d failed to claim a job", worker_id)
            job = None

        if job is None:
            await asyncio.sleep(POLL_INTERVAL_SECONDS)
            continue

        await _process_job(job)


def start_workers(concurrency: int) -> list[asyncio.Task]:
    global _worker_tasks
    _worker_tasks = [asyncio.create_task(_worker_loop(i)) for i in range(concurrency)]
    return _worker_tasks


async def stop_workers() -> None:
    for task in _worker_tasks:
        task.cancel()
    for task in _worker_tasks:
        try:
            await task
        except asyncio.CancelledError:
            pass
    _worker_tasks.clear()
