from crewai import LLM

from app.agents.gemini_keys import key_manager
from app.config import settings


def get_llm(temperature: float = 0.7) -> LLM:
    """Course/lesson text generation switches between providers via settings.llm_provider —
    Gemini's free tier exhausts in a handful of requests, so OpenAI is the default. Video
    discovery/notes and Hinglish TTS stay on Gemini directly (see gemini_client.py) since
    those use google-genai features (search grounding, native YouTube understanding, TTS)
    with no OpenAI equivalent.

    Called fresh for every agent build (never cached), so when `with_retries` rotates
    the active Gemini key after a quota/rate-limit failure, the retried attempt picks
    up the newly-rotated key here automatically."""
    if settings.llm_provider == "gemini":
        api_key = key_manager.current_key() if key_manager.key_count else settings.gemini_api_key
        return LLM(model=settings.gemini_model, api_key=api_key, temperature=temperature)
    return LLM(model=settings.openai_model, api_key=settings.openai_api_key, temperature=temperature)
