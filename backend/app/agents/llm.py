from crewai import LLM

from app.config import settings


def get_llm(temperature: float = 0.7) -> LLM:
    """Course/lesson text generation switches between providers via settings.llm_provider —
    Gemini's free tier exhausts in a handful of requests, so OpenAI is the default. Video
    discovery/notes and Hinglish TTS stay on Gemini directly (see gemini_client.py) since
    those use google-genai features (search grounding, native YouTube understanding, TTS)
    with no OpenAI equivalent."""
    if settings.llm_provider == "gemini":
        return LLM(model=settings.gemini_model, api_key=settings.gemini_api_key, temperature=temperature)
    return LLM(model=settings.openai_model, api_key=settings.openai_api_key, temperature=temperature)
