"""Discovers and rotates across every GEMINI_API_KEY* credential.

Keys are read directly from the .env file (pydantic-settings loads env_file
values internally without exporting them to os.environ) merged with any
real process environment variables (so this also works on Render, where
secrets are set as actual env vars with no .env file present). No fixed key
count is assumed — any GEMINI_API_KEY_<N> suffix is picked up automatically.
"""

import logging
import os
import re
import threading
from pathlib import Path

from dotenv import dotenv_values

logger = logging.getLogger(__name__)

_KEY_NAME_PATTERN = re.compile(r"^GEMINI_API_KEY(?:_(\d+))?$")
_ENV_FILE = Path(__file__).resolve().parents[2] / ".env"

_RETRYABLE_STATUS_CODES = {408, 429, 500, 502, 503, 504}
_RETRYABLE_MESSAGE_TOKENS = (
    "rate limit",
    "rate_limit",
    "quota",
    "resource_exhausted",
    "resource exhausted",
    "429",
    "too many requests",
    "overloaded",
    "unavailable",
    "deadline exceeded",
)


def mask_key(key: str) -> str:
    if len(key) <= 8:
        return "****"
    return f"{key[:4]}...{key[-4:]}"


def _discover_keys() -> list[str]:
    merged: dict[str, str] = {}
    try:
        merged.update({k: v for k, v in dotenv_values(_ENV_FILE).items() if v})
    except OSError:
        pass
    merged.update({k: v for k, v in os.environ.items() if v and k.startswith("GEMINI_API_KEY")})

    primary: str | None = None
    numbered: list[tuple[int, str]] = []
    for name, value in merged.items():
        match = _KEY_NAME_PATTERN.match(name)
        if not match:
            continue
        suffix = match.group(1)
        if suffix is None:
            primary = value
        else:
            numbered.append((int(suffix), value))
    numbered.sort(key=lambda pair: pair[0])

    ordered = ([primary] if primary else []) + [value for _, value in numbered]
    seen: set[str] = set()
    unique: list[str] = []
    for key in ordered:
        if key not in seen:
            seen.add(key)
            unique.append(key)
    return unique


def is_retryable_error(exc: BaseException) -> bool:
    """Best-effort classification across the google-genai SDK and litellm (used by
    CrewAI's LLM wrapper) — both surface rate-limit/quota errors with different
    exception types, so this matches on whichever signal is available."""
    status = getattr(exc, "status_code", None) or getattr(exc, "code", None)
    if isinstance(status, int) and status in _RETRYABLE_STATUS_CODES:
        return True
    message = str(exc).lower()
    return any(token in message for token in _RETRYABLE_MESSAGE_TOKENS)


class GeminiKeysExhausted(RuntimeError):
    pass


class GeminiKeyManager:
    def __init__(self) -> None:
        self._keys = _discover_keys()
        self._lock = threading.Lock()
        self._index = 0
        if self._keys:
            logger.info(
                "Loaded %d Gemini API key(s): %s",
                len(self._keys),
                ", ".join(mask_key(k) for k in self._keys),
            )
        else:
            logger.warning("No GEMINI_API_KEY* variables found — Gemini calls will fail.")

    @property
    def key_count(self) -> int:
        return len(self._keys)

    def current_key(self) -> str:
        with self._lock:
            if not self._keys:
                raise GeminiKeysExhausted("No Gemini API keys are configured.")
            return self._keys[self._index]

    def rotate(self, failed_key: str | None = None) -> str | None:
        """Advances past `failed_key` to the next key and returns it, or None if
        there is no other key to fall back to. Thread-safe and safe to call
        concurrently — if another caller already rotated past `failed_key`,
        this just returns the (already-rotated) current key without moving twice."""
        with self._lock:
            if len(self._keys) <= 1:
                return None
            current = self._keys[self._index]
            if failed_key is not None and current != failed_key:
                return current
            previous_index = self._index
            self._index = (self._index + 1) % len(self._keys)
            logger.warning(
                "Rotating Gemini API key %s -> %s",
                mask_key(self._keys[previous_index]),
                mask_key(self._keys[self._index]),
            )
            return self._keys[self._index]


key_manager = GeminiKeyManager()
