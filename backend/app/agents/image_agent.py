"""Course cover image discovery.

Uses the raw google-genai SDK (see video_agent.py) for Google Search
grounding — same technique as video discovery, no separate image-provider
API key required. Grounding chunks are web pages, not direct image files,
so most resolved URLs won't actually be hotlinkable images; Wikipedia's
keyless REST API is used as a second, more reliable pass since most course
topics have a Wikipedia page with a usable thumbnail.
"""

import httpx
from google.genai import types

from app.agents.gemini_client import GEMINI_MODEL_NAME, generate_content
from app.agents.video_agent import resolve_grounding_redirect
from app.services.cache import AsyncTTLCache, cache_key

_IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp")
_WIKIPEDIA_SUMMARY_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/"

# Same rationale as video_agent's discovery cache: grounded image search for a
# given course topic doesn't meaningfully change minute-to-minute.
_image_cache = AsyncTTLCache(maxsize=256, ttl=24 * 60 * 60)


async def _looks_like_image(http_client: httpx.AsyncClient, url: str) -> bool:
    if url.lower().split("?")[0].endswith(_IMAGE_EXTENSIONS):
        return True
    try:
        resp = await http_client.head(url, follow_redirects=True)
        return resp.headers.get("content-type", "").startswith("image/")
    except httpx.HTTPError:
        return False


async def _grounded_image_url(course_title: str, description: str) -> str | None:
    response = await generate_content(
        model=GEMINI_MODEL_NAME,
        contents=(
            "Find one high-quality, topic-relevant photo or illustration suitable as a "
            f"course cover image. Course: '{course_title}'. {description}"
        ),
        config=types.GenerateContentConfig(
            tools=[types.Tool(google_search=types.GoogleSearch())],
        ),
    )
    grounding_metadata = response.candidates[0].grounding_metadata
    chunks = grounding_metadata.grounding_chunks if grounding_metadata else None

    async with httpx.AsyncClient(timeout=5.0) as http_client:
        for chunk in chunks or []:
            if not chunk.web or not chunk.web.uri:
                continue
            resolved_url = await resolve_grounding_redirect(http_client, chunk.web.uri)
            if resolved_url and await _looks_like_image(http_client, resolved_url):
                return resolved_url
    return None


async def _wikipedia_thumbnail(course_title: str) -> str | None:
    try:
        async with httpx.AsyncClient(timeout=5.0) as http_client:
            resp = await http_client.get(
                f"{_WIKIPEDIA_SUMMARY_URL}{course_title}",
                headers={"accept": "application/json"},
                follow_redirects=True,
            )
            if resp.status_code != 200:
                return None
            return resp.json().get("thumbnail", {}).get("source")
    except httpx.HTTPError:
        return None


async def discover_topic_image(course_title: str, description: str) -> str | None:
    key = cache_key(course_title, description)
    cached = _image_cache.get(key)
    if cached is not None:
        return cached or None

    url = await _grounded_image_url(course_title, description) or await _wikipedia_thumbnail(
        course_title
    )
    _image_cache.set(key, url or "")
    return url
