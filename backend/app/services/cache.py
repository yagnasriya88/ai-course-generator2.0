import hashlib
import threading
from typing import Any

from cachetools import TTLCache


class AsyncTTLCache:
    """Thread-safe TTL cache for reuse from both request handlers and the
    background job workers, which share one process. cachetools' TTLCache
    itself is a plain dict wrapper with no locking, so concurrent access
    across asyncio tasks/threads needs a guard."""

    def __init__(self, maxsize: int, ttl: float):
        self._cache: TTLCache = TTLCache(maxsize=maxsize, ttl=ttl)
        self._lock = threading.Lock()

    def get(self, key: str) -> Any:
        with self._lock:
            return self._cache.get(key)

    def set(self, key: str, value: Any) -> None:
        with self._lock:
            self._cache[key] = value

    def pop(self, key: str) -> None:
        with self._lock:
            self._cache.pop(key, None)


def cache_key(*parts: str) -> str:
    """Stable, short cache key from arbitrary text parts — normalizes case/
    whitespace so trivially-different phrasing of the same request still
    hits the same cache entry."""
    normalized = "|".join(p.strip().lower() for p in parts if p is not None)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()
