"""Persistent, MongoDB-backed job queue for diagram generation — a separate
collection/worker from generation_jobs (course generation) so the two
pipelines can evolve independently without risking the working course path.
Mirrors job_service.py's semantics exactly (see that file for design notes)."""

import hashlib
import logging
from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from pymongo import ReturnDocument

from app.database import get_database
from app.models.diagram_job import DiagramJob
from app.models.diagram import DiagramGenerateRequest

COLLECTION = "diagram_jobs"
ACTIVE_STATUSES = ("queued", "processing")

logger = logging.getLogger(__name__)


def _dedupe_key(owner_id: str, request: DiagramGenerateRequest) -> str:
    raw = "|".join(
        [
            owner_id,
            request.topic.strip().lower(),
            request.diagram_type.strip().lower(),
            (request.detail or "").strip().lower(),
        ]
    )
    return hashlib.sha256(raw.encode()).hexdigest()


async def create_job(owner_id: str, request: DiagramGenerateRequest) -> tuple[DiagramJob, bool]:
    """Returns (job, created) — `created` is False when an identical request is
    already queued/processing for this user, in which case the existing job is
    returned unchanged instead of enqueuing a duplicate."""
    db = get_database()
    dedupe_key = _dedupe_key(owner_id, request)

    existing_doc = await db[COLLECTION].find_one(
        {"owner_id": owner_id, "dedupe_key": dedupe_key, "status": {"$in": ACTIVE_STATUSES}}
    )
    if existing_doc:
        return DiagramJob(**existing_doc), False

    job = DiagramJob(owner_id=owner_id, request=request, dedupe_key=dedupe_key)
    doc = job.model_dump(by_alias=True, exclude={"id"})
    result = await db[COLLECTION].insert_one(doc)
    job.id = str(result.inserted_id)
    logger.info("Diagram job %s queued for owner=%s topic=%r", job.id, owner_id, request.topic)
    return job, True


async def get_job(job_id: str) -> DiagramJob | None:
    try:
        object_id = ObjectId(job_id)
    except InvalidId:
        return None
    db = get_database()
    doc = await db[COLLECTION].find_one({"_id": object_id})
    return DiagramJob(**doc) if doc else None


async def list_jobs_for_user(owner_id: str, limit: int = 50) -> list[DiagramJob]:
    db = get_database()
    cursor = db[COLLECTION].find({"owner_id": owner_id}).sort("created_at", -1).limit(limit)
    return [DiagramJob(**doc) async for doc in cursor]


async def claim_next_queued_job() -> DiagramJob | None:
    db = get_database()
    doc = await db[COLLECTION].find_one_and_update(
        {"status": "queued"},
        {
            "$set": {
                "status": "processing",
                "started_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            },
            "$inc": {"attempts": 1},
        },
        sort=[("created_at", 1)],
        return_document=ReturnDocument.AFTER,
    )
    return DiagramJob(**doc) if doc else None


async def mark_completed(job_id: str, diagram_id: str) -> None:
    db = get_database()
    now = datetime.now(timezone.utc)
    await db[COLLECTION].update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {"status": "completed", "diagram_id": diagram_id, "updated_at": now, "finished_at": now}},
    )
    logger.info("Diagram job %s completed -> diagram %s", job_id, diagram_id)


async def mark_failed(job_id: str, error: str, *, requeue: bool) -> None:
    db = get_database()
    now = datetime.now(timezone.utc)
    if requeue:
        await db[COLLECTION].update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {"status": "queued", "error": error, "updated_at": now}},
        )
        logger.warning("Diagram job %s failed (will retry): %s", job_id, error)
    else:
        await db[COLLECTION].update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {"status": "failed", "error": error, "updated_at": now, "finished_at": now}},
        )
        logger.error("Diagram job %s failed permanently: %s", job_id, error)


async def requeue_stale_processing_jobs() -> int:
    """Runs once at startup — any job still `processing` was mid-flight when the
    server last stopped (crash or redeploy). Reset to `queued` so a worker picks
    it back up instead of it being stuck forever."""
    db = get_database()
    result = await db[COLLECTION].update_many(
        {"status": "processing"},
        {"$set": {"status": "queued", "updated_at": datetime.now(timezone.utc)}},
    )
    if result.modified_count:
        logger.warning("Requeued %d diagram job(s) left processing from a previous run", result.modified_count)
    return result.modified_count
