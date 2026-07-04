from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_current_user
from app.models.user import User, UserLoginRequest, UserSignupRequest
from app.services import auth_service, user_service

router = APIRouter(prefix="/auth", tags=["auth"])


def _public(user: User) -> dict:
    return {"id": user.id, "name": user.name, "email": user.email}


@router.post("/signup")
async def signup(request: UserSignupRequest):
    if await user_service.get_user_by_email(request.email):
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    user = User(
        name=request.name,
        email=request.email,
        password_hash=auth_service.hash_password(request.password),
    )
    saved = await user_service.create_user(user)
    token = auth_service.create_access_token(saved.id)
    return {"access_token": token, "user": _public(saved)}


@router.post("/login")
async def login(request: UserLoginRequest):
    user = await user_service.get_user_by_email(request.email)
    if not user or not auth_service.verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = auth_service.create_access_token(user.id)
    return {"access_token": token, "user": _public(user)}


@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    return _public(current_user)
