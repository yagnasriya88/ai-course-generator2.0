import base64
import io
import logging
import re
import threading
import wave

from google import genai

from app.agents.gemini_keys import GeminiKeysExhausted, is_retryable_error, key_manager, mask_key
from app.config import settings

logger = logging.getLogger(__name__)

# CrewAI's LLM wants the "gemini/model-name" litellm form; the raw google-genai
# SDK wants just "model-name" — this is the single place that reconciles them.
GEMINI_MODEL_NAME = settings.gemini_model.split("/", 1)[-1]
GEMINI_TTS_MODEL_NAME = "gemini-2.5-flash-preview-tts"

_clients: dict[str, genai.Client] = {}
_clients_lock = threading.Lock()


def _client_for(api_key: str) -> genai.Client:
    """Clients are cheap to build but are cached per-key anyway so rotation
    doesn't churn a new client on every single call once a key has failed."""
    with _clients_lock:
        existing = _clients.get(api_key)
        if existing is None:
            existing = genai.Client(api_key=api_key)
            _clients[api_key] = existing
        return existing


async def generate_content(**kwargs):
    """Drop-in replacement for `client.aio.models.generate_content(**kwargs)` that
    transparently retries on the next available Gemini key when the current one
    hits a rate limit/quota/transient error, trying every configured key at most
    once before giving up."""
    attempts = max(key_manager.key_count, 1)
    last_exc: Exception | None = None

    for _ in range(attempts):
        current_key = key_manager.current_key()
        try:
            client = _client_for(current_key)
            return await client.aio.models.generate_content(**kwargs)
        except GeminiKeysExhausted:
            raise
        except Exception as exc:
            last_exc = exc
            if not is_retryable_error(exc):
                raise
            logger.warning(
                "Gemini call failed on key %s (retryable): %s", mask_key(current_key), exc
            )
            if key_manager.rotate(current_key) is None:
                break

    assert last_exc is not None
    raise GeminiKeysExhausted(
        f"All {attempts} Gemini API key(s) failed; last error: {last_exc}"
    ) from last_exc


def strip_json_fences(text: str) -> str:
    match = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL)
    return match.group(1).strip() if match else text.strip()


def pcm_to_wav_base64(
    pcm_bytes: bytes, sample_rate: int = 24000, channels: int = 1, sample_width: int = 2
) -> str:
    """Gemini TTS returns raw 16-bit PCM (no container) — wrap it in a WAV
    header so it plays directly in a browser <audio> element."""
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav_file:
        wav_file.setnchannels(channels)
        wav_file.setsampwidth(sample_width)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(pcm_bytes)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")
