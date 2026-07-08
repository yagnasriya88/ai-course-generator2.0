"""In-process background workers that drain the MongoDB-backed generation job
queue. No Celery/Redis — a handful of asyncio loops polling Atlas is enough
for this app's scale, and `claim_next_queued_job`'s atomic find_one_and_update
keeps concurrent claims safe even across multiple workers or server replicas.
"""

import asyncio
import logging

from app.models.job import GenerationJob
from app.services import generation_service, job_service

logger = logging.getLogger(__name__)

POLL_INTERVAL_SECONDS = 1.0

_worker_tasks: list[asyncio.Task] = []


async def _process_job(job: GenerationJob) -> None:
    logger.info(
        "Processing job %s (topic=%r, attempt %d/%d)",
        job.id,
        job.request.topic,
        job.attempts,
        job.max_attempts,
    )
    try:
        course = await generation_service.generate_course(job.request, owner_id=job.owner_id)
        await job_service.mark_completed(job.id, course.id)
    except Exception as exc:
        can_retry = job.attempts < job.max_attempts
        await job_service.mark_failed(
            job.id,
            "Something went wrong while generating this course. Please try again." if not can_retry else str(exc),
            requeue=can_retry,
        )


async def _worker_loop(worker_id: int) -> None:
    logger.info("Job worker %d started", worker_id)
    while True:
        try:
            job = await job_service.claim_next_queued_job()
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Worker %d failed to claim a job", worker_id)
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
