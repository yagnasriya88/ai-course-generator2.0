from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId

from app.database import get_database
from app.models.diagram import DiagramEdge, DiagramNode, DiagramUpdateRequest, KnowledgeCanvas

COLLECTION = "diagrams"


async def create_canvas(canvas: KnowledgeCanvas) -> KnowledgeCanvas:
    db = get_database()
    doc = canvas.model_dump(by_alias=True, exclude={"id"})
    result = await db[COLLECTION].insert_one(doc)
    canvas.id = str(result.inserted_id)
    return canvas


async def get_canvas(canvas_id: str) -> KnowledgeCanvas | None:
    try:
        object_id = ObjectId(canvas_id)
    except InvalidId:
        return None
    db = get_database()
    doc = await db[COLLECTION].find_one({"_id": object_id})
    return KnowledgeCanvas(**doc) if doc else None


async def list_canvases_for_user(owner_id: str, limit: int = 50) -> list[KnowledgeCanvas]:
    db = get_database()
    cursor = db[COLLECTION].find({"owner_id": owner_id}).sort("updated_at", -1).limit(limit)
    return [KnowledgeCanvas(**doc) async for doc in cursor]


async def update_canvas(canvas_id: str, update: DiagramUpdateRequest) -> KnowledgeCanvas | None:
    db = get_database()
    fields = update.model_dump(exclude_none=True)
    if not fields:
        return await get_canvas(canvas_id)

    set_doc: dict = {"updated_at": datetime.now(timezone.utc)}
    if "title" in fields:
        set_doc["title"] = fields["title"]
    if "is_favorite" in fields:
        set_doc["is_favorite"] = fields["is_favorite"]
    if "nodes" in fields:
        set_doc["nodes"] = fields["nodes"]
    if "edges" in fields:
        set_doc["edges"] = fields["edges"]

    try:
        object_id = ObjectId(canvas_id)
    except InvalidId:
        return None
    await db[COLLECTION].update_one({"_id": object_id}, {"$set": set_doc})
    return await get_canvas(canvas_id)


async def set_graph(canvas_id: str, nodes: list[DiagramNode], edges: list[DiagramEdge]) -> KnowledgeCanvas | None:
    return await update_canvas(
        canvas_id, DiagramUpdateRequest(nodes=nodes, edges=edges)
    )


async def delete_canvas(canvas_id: str) -> bool:
    try:
        object_id = ObjectId(canvas_id)
    except InvalidId:
        return False
    db = get_database()
    result = await db[COLLECTION].delete_one({"_id": object_id})
    return result.deleted_count > 0


async def duplicate_canvas(canvas_id: str) -> KnowledgeCanvas | None:
    original = await get_canvas(canvas_id)
    if not original:
        return None
    copy = KnowledgeCanvas(
        owner_id=original.owner_id,
        title=f"{original.title} (Copy)",
        diagram_type=original.diagram_type,
        source_topic=original.source_topic,
        nodes=list(original.nodes),
        edges=list(original.edges),
    )
    return await create_canvas(copy)
