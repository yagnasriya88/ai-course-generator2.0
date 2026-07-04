import asyncio
import logging
from typing import Awaitable, Callable, TypeVar

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
    JSON) or hit a transient API error — retry a few times before giving up."""
    last_exc: Exception | None = None
    for attempt in range(retries + 1):
        try:
            return await coro_fn(*args, **kwargs)
        except Exception as exc:
            last_exc = exc
            logger.warning(
                "%s attempt %s/%s failed: %s",
                getattr(coro_fn, "__name__", coro_fn),
                attempt + 1,
                retries + 1,
                exc,
            )
            if attempt < retries:
                await asyncio.sleep(delay_seconds)
    assert last_exc is not None
    raise last_exc
