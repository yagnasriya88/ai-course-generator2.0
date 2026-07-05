import asyncio
import logging
from typing import Awaitable, Callable, TypeVar

from app.agents.gemini_keys import is_retryable_error, key_manager
from app.config import settings

logger = logging.getLogger(__name__)

T = TypeVar("T")


async def with_retries(
    coro_fn: Callable[..., Awaitable[T]],
    *args,
    retries: int = 2,
    delay_seconds: float = 1.5,
    **kwargs,
) -> T:
    """Agent output can fail to validate against its schema (malformed/partial
    JSON) or hit a transient API error — retry a few times before giving up.

    When the active text-gen provider is Gemini and a failure looks like a
    rate-limit/quota error, rotates to the next configured GEMINI_API_KEY*
    before the next attempt — `get_llm()` reads the current key fresh on every
    call, so the retried attempt picks it up automatically. Effective retry
    count is bumped to give every configured key a chance."""
    use_gemini_rotation = settings.llm_provider == "gemini" and key_manager.key_count > 1
    effective_retries = max(retries, key_manager.key_count - 1) if use_gemini_rotation else retries

    last_exc: Exception | None = None
    for attempt in range(effective_retries + 1):
        try:
            return await coro_fn(*args, **kwargs)
        except Exception as exc:
            last_exc = exc
            rotated = use_gemini_rotation and is_retryable_error(exc) and key_manager.rotate() is not None
            logger.warning(
                "%s attempt %s/%s failed%s: %s",
                getattr(coro_fn, "__name__", coro_fn),
                attempt + 1,
                effective_retries + 1,
                " (rotated Gemini key)" if rotated else "",
                exc,
            )
            if attempt < effective_retries:
                await asyncio.sleep(delay_seconds)
    assert last_exc is not None
    raise last_exc
