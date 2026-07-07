import logging

import jwt
from fastapi import Header, HTTPException

from app.models.user import User
from app.services import clerk_client, user_service

logger = logging.getLogger(__name__)


async def get_current_user(authorization: str | None = Header(default=None)) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.split(" ", 1)[1]
    try:
        clerk_user_id = clerk_client.verify_session_token(token)
    except jwt.PyJWTError:
        logger.warning("Rejected request with an invalid or expired Clerk session token")
        raise HTTPException(status_code=401, detail="Invalid or expired session") from None

    return await user_service.get_or_create_from_clerk(clerk_user_id)
