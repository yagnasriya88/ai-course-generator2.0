import base64
import io
import re
import wave

from google import genai

from app.config import settings

# CrewAI's LLM wants the "gemini/model-name" litellm form; the raw google-genai
# SDK wants just "model-name" — this is the single place that reconciles them.
GEMINI_MODEL_NAME = settings.gemini_model.split("/", 1)[-1]
GEMINI_TTS_MODEL_NAME = "gemini-2.5-flash-preview-tts"

client = genai.Client(api_key=settings.gemini_api_key)


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
