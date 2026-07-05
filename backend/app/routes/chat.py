from fastapi import APIRouter, Depends
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
