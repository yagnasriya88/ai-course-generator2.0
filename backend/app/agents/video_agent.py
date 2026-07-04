"""Video Learning Agent.

Uses the raw google-genai SDK rather than CrewAI/LiteLLM: Gemini's Google
Search grounding tool (for discovery) and native YouTube URL understanding
(for notes) are Gemini-specific features not exposed through CrewAI's
generic LLM interface.
"""

import json

import httpx
from google.genai import types

from app.agents.gemini_client import GEMINI_MODEL_NAME, client, strip_json_fences
from app.models.lesson import Lesson, VideoRecommendation
from app.models.video_note import TimestampNote, VideoNote


async def _resolve_redirect(http_client: httpx.AsyncClient, grounding_url: str) -> str | None:
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


async def discover_videos(lesson: Lesson, max_results: int = 3) -> list[VideoRecommendation]:
    """The model's own JSON output can name a plausible-but-hallucinated video
    ID even with grounding enabled — only `grounding_metadata.grounding_chunks`
    (the actual search citations) are trustworthy for the URL itself."""
    response = await client.aio.models.generate_content(
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

    validated: list[VideoRecommendation] = []
    seen_urls: set[str] = set()

    async with httpx.AsyncClient(timeout=5.0) as http_client:
        for chunk in chunks or []:
            if len(validated) >= max_results:
                break
            if not chunk.web or not chunk.web.uri:
                continue
            resolved_url = await _resolve_redirect(http_client, chunk.web.uri)
            if not resolved_url or "youtube.com/watch" not in resolved_url:
                continue
            if resolved_url in seen_urls:
                continue
            seen_urls.add(resolved_url)
            title = await _oembed_title(http_client, resolved_url)
            if title is None:
                continue
            validated.append(VideoRecommendation(title=title, url=resolved_url, query=lesson.title))

    return validated


async def generate_video_notes(lesson_id: str, video_url: str, lesson_title: str) -> VideoNote:
    response = await client.aio.models.generate_content(
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
