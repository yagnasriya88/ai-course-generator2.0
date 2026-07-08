"""Direct-LLM token streaming for chat-shaped agents (tutor, general chat,
video Q&A) that bypass CrewAI — CrewAI's Agent/Crew.kickoff_async() always
returns a full completion, never a stream, so agents that need to feel
responsive token-by-token call the underlying provider directly here instead.

Switches on settings.llm_provider exactly like agents/llm.py's get_llm(),
just for a streaming call shape instead of CrewAI's LLM object. Structured-
output agents (course/quiz/visual/graph generation) are unaffected — they
keep using CrewAI/output_pydantic, which this module does not touch.

Retry/key-rotation only applies before the first chunk is yielded (connection
setup). Once tokens are flowing to the client, a failure ends the stream —
retrying mid-stream would either duplicate already-sent text or require
buffering the whole response, defeating the point of streaming.
"""

import logging
from typing import AsyncIterator

import litellm
from google.genai import types

from app.agents.gemini_client import GEMINI_MODEL_NAME, _client_for
from app.agents.gemini_keys import GeminiKeysExhausted, is_retryable_error, key_manager, mask_key
from app.config import settings

logger = logging.getLogger(__name__)


async def stream_chat_completion(
    system_prompt: str, user_prompt: str, temperature: float = 0.6
) -> AsyncIterator[str]:
    if settings.llm_provider == "gemini":
        async for delta in _stream_gemini(system_prompt, user_prompt, temperature):
            yield delta
    else:
        async for delta in _stream_openai(system_prompt, user_prompt, temperature):
            yield delta


async def _stream_openai(
    system_prompt: str, user_prompt: str, temperature: float
) -> AsyncIterator[str]:
    response = await litellm.acompletion(
        model=settings.openai_model,
        api_key=settings.openai_api_key,
        temperature=temperature,
        stream=True,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )
    async for chunk in response:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta


async def _stream_gemini(
    system_prompt: str, user_prompt: str, temperature: float
) -> AsyncIterator[str]:
    attempts = max(key_manager.key_count, 1)
    last_exc: Exception | None = None

    for _ in range(attempts):
        current_key = key_manager.current_key()
        try:
            client = _client_for(current_key)
            stream = await client.aio.models.generate_content_stream(
                model=GEMINI_MODEL_NAME,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=temperature,
                ),
            )
            async for chunk in stream:
                if chunk.text:
                    yield chunk.text
            return
        except GeminiKeysExhausted:
            raise
        except Exception as exc:
            last_exc = exc
            if not is_retryable_error(exc):
                raise
            logger.warning(
                "Gemini stream failed to start on key %s (retryable): %s",
                mask_key(current_key),
                exc,
            )
            if key_manager.rotate(current_key) is None:
                break

    assert last_exc is not None
    raise GeminiKeysExhausted(f"All {attempts} Gemini API key(s) failed; last error: {last_exc}") from last_exc
