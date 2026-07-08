"""Video Learning Agent.

Uses the raw google-genai SDK rather than CrewAI/LiteLLM: Gemini's Google
Search grounding tool (for discovery) and native YouTube URL understanding
(for notes) are Gemini-specific features not exposed through CrewAI's
generic LLM interface.
"""

import json

import httpx
from google.genai import types

import asyncio
from typing import AsyncIterator

from app.agents.gemini_client import GEMINI_MODEL_NAME, _client_for, generate_content, strip_json_fences
from app.agents.gemini_keys import key_manager
from app.models.lesson import Lesson, VideoRecommendation
from app.models.video_note import TimestampNote, VideoNote
from app.services.cache import AsyncTTLCache, cache_key

# Grounded search results for a given lesson topic don't meaningfully change
# minute-to-minute — cache to avoid repeating a search-grounding call plus
# several oEmbed/redirect HTTP round-trips for duplicate/retried topics.
_discovery_cache = AsyncTTLCache(maxsize=256, ttl=24 * 60 * 60)


async def resolve_grounding_redirect(http_client: httpx.AsyncClient, grounding_url: str) -> str | None:
    """grounding_chunks give a vertexaisearch.cloud.google.com redirect, not the
    real URL — resolve it. httpx does not follow redirects by default, so a 3xx
    response with a Location header is expected here, not an error."""
    try:
        resp = await http_client.get(grounding_url)
        if resp.status_code in (301, 302, 303, 307, 308):
            return resp.headers.get("location")
        return str(resp.url) if resp.status_code == 200 else None
    except httpx.HTTPError:
        return None


async def _oembed_title(http_client: httpx.AsyncClient, video_url: str) -> str | None:
    """Also doubles as the embeddability check — a 404 here means the video
    doesn't exist or can't be embedded."""
    oembed_url = f"https://www.youtube.com/oembed?url={video_url}&format=json"
    try:
        resp = await http_client.get(oembed_url)
        return resp.json().get("title") if resp.status_code == 200 else None
    except httpx.HTTPError:
        return None


async def _resolve_chunk(
    http_client: httpx.AsyncClient, chunk, lesson_title: str
) -> tuple[str, VideoRecommendation] | None:
    if not chunk.web or not chunk.web.uri:
        return None
    resolved_url = await resolve_grounding_redirect(http_client, chunk.web.uri)
    if not resolved_url or "youtube.com/watch" not in resolved_url:
        return None
    title = await _oembed_title(http_client, resolved_url)
    if title is None:
        return None
    return resolved_url, VideoRecommendation(title=title, url=resolved_url, query=lesson_title)


async def discover_videos(lesson: Lesson, max_results: int = 3) -> list[VideoRecommendation]:
    """The model's own JSON output can name a plausible-but-hallucinated video
    ID even with grounding enabled — only `grounding_metadata.grounding_chunks`
    (the actual search citations) are trustworthy for the URL itself."""
    key = cache_key(lesson.title, str(max_results))
    cached = _discovery_cache.get(key)
    if cached is not None:
        return cached

    response = await generate_content(
        model=GEMINI_MODEL_NAME,
        contents=(
            f"Find {max_results} high-quality YouTube videos that teach: "
            f"'{lesson.title}'. Briefly describe each one."
        ),
        config=types.GenerateContentConfig(
            tools=[types.Tool(google_search=types.GoogleSearch())],
        ),
    )
    grounding_metadata = response.candidates[0].grounding_metadata
    chunks = grounding_metadata.grounding_chunks if grounding_metadata else None

    async with httpx.AsyncClient(timeout=5.0) as http_client:
        results = await asyncio.gather(
            *(_resolve_chunk(http_client, chunk, lesson.title) for chunk in chunks or []),
            return_exceptions=True,
        )

    validated: list[VideoRecommendation] = []
    seen_urls: set[str] = set()
    for result in results:
        if isinstance(result, BaseException) or result is None:
            continue
        resolved_url, recommendation = result
        if resolved_url in seen_urls:
            continue
        seen_urls.add(resolved_url)
        validated.append(recommendation)
        if len(validated) >= max_results:
            break

    _discovery_cache.set(key, validated)
    return validated


async def ask_about_video(video_url: str, lesson_title: str, question: str) -> str:
    response = await generate_content(
        model=GEMINI_MODEL_NAME,
        contents=types.Content(
            parts=[
                types.Part(file_data=types.FileData(file_uri=video_url)),
                types.Part(
                    text=(
                        f"This video is being watched alongside a lesson titled "
                        f"'{lesson_title}'. Answer the viewer's question about the video "
                        f"clearly and concisely, grounded in what's actually shown/said.\n\n"
                        f"Question: {question}"
                    )
                ),
            ]
        ),
    )
    return response.text


async def stream_about_video(video_url: str, lesson_title: str, question: str) -> AsyncIterator[str]:
    """Gemini-only (native YouTube file understanding has no OpenAI equivalent) —
    streams directly via generate_content_stream instead of the buffered
    generate_content() ask_about_video uses."""
    client = _client_for(key_manager.current_key())
    stream = await client.aio.models.generate_content_stream(
        model=GEMINI_MODEL_NAME,
        contents=types.Content(
            parts=[
                types.Part(file_data=types.FileData(file_uri=video_url)),
                types.Part(
                    text=(
                        f"This video is being watched alongside a lesson titled "
                        f"'{lesson_title}'. Answer the viewer's question about the video "
                        f"clearly and concisely, grounded in what's actually shown/said.\n\n"
                        f"Question: {question}"
                    )
                ),
            ]
        ),
    )
    async for chunk in stream:
        if chunk.text:
            yield chunk.text


async def generate_video_notes(lesson_id: str, video_url: str, lesson_title: str) -> VideoNote:
    response = await generate_content(
        model=GEMINI_MODEL_NAME,
        contents=types.Content(
            parts=[
                types.Part(file_data=types.FileData(file_uri=video_url)),
                types.Part(
                    text=(
                        f"This video is being watched alongside a lesson titled "
                        f"'{lesson_title}'. Return ONLY JSON with keys: "
                        "summary (string), key_concepts (string[]), "
                        "timestamps (array of {time, note}), revision_notes (string[]), "
                        "takeaways (string[])."
                    )
                ),
            ]
        ),
    )
    data = json.loads(strip_json_fences(response.text))
    return VideoNote(
        lesson_id=lesson_id,
        video_url=video_url,
        summary=data.get("summary", ""),
        key_concepts=data.get("key_concepts", []),
        timestamps=[TimestampNote(**t) for t in data.get("timestamps", [])],
        revision_notes=data.get("revision_notes", []),
        takeaways=data.get("takeaways", []),
    )
