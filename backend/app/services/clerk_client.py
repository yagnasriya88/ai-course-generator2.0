"""Talks to Clerk: verifies session JWTs locally against Clerk's published
JWKS (no network call on the hot path), and calls Clerk's Backend API for
profile fields (email/name) that session tokens don't carry — needed once,
at first-login profile creation.
"""

import logging

import httpx
import jwt

from app.config import settings

logger = logging.getLogger(__name__)

CLERK_API_BASE = "https://api.clerk.com/v1"

_jwks_client: jwt.PyJWKClient | None = None


def _get_jwks_client() -> jwt.PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        _jwks_client = jwt.PyJWKClient(f"{settings.clerk_issuer}/.well-known/jwks.json")
    return _jwks_client


def verify_session_token(token: str) -> str:
    """Verifies signature, issuer, and expiry; returns the Clerk user id (the
    `sub` claim). Raises jwt.PyJWTError on any verification failure."""
    signing_key = _get_jwks_client().get_signing_key_from_jwt(token)
    payload = jwt.decode(
        token,
        signing_key.key,
        algorithms=["RS256"],
        issuer=settings.clerk_issuer,
        options={"require": ["exp", "sub", "iss"]},
    )
    return payload["sub"]


def _primary_email(data: dict) -> str:
    primary_id = data.get("primary_email_address_id")
    addresses = data.get("email_addresses", [])
    for addr in addresses:
        if addr.get("id") == primary_id:
            return addr.get("email_address", "")
    return addresses[0]["email_address"] if addresses else ""


def _display_name(data: dict, email: str) -> str:
    name = " ".join(filter(None, [data.get("first_name"), data.get("last_name")])).strip()
    return name or (email.split("@")[0] if email else "Learner")


async def fetch_clerk_profile(clerk_user_id: str) -> dict:
    """Fetches the fields we need to create a local profile: email + display
    name. Only called once per user (on first sign-in / legacy migration) —
    every subsequent request resolves the user from our own database."""
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            f"{CLERK_API_BASE}/users/{clerk_user_id}",
            headers={"Authorization": f"Bearer {settings.clerk_secret_key}"},
        )
        resp.raise_for_status()
        data = resp.json()

    email = _primary_email(data)
    return {"email": email, "name": _display_name(data, email)}
