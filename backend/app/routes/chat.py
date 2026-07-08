import json

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.agents import general_chat_agent
from app.agents.retry import with_retries
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatQuestion(BaseModel):
    question: str


@router.post("/ask")
async def ask(body: ChatQuestion, current_user: User = Depends(get_current_user)):
    answer = await with_retries(general_chat_agent.ask_general, body.question)
    return {"answer": answer}


@router.post("/ask/stream")
async def ask_stream(body: ChatQuestion, current_user: User = Depends(get_current_user)):
    async def event_gen():
        try:
            async for delta in general_chat_agent.stream_general_answer(body.question):
                yield f"data: {json.dumps({'delta': delta})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as exc:
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"

    return StreamingResponse(event_gen(), media_type="text/event-stream")
