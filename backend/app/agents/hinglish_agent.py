"""Hinglish Teacher Agent.

Translation runs through CrewAI (structured text output). TTS synthesis goes
through the raw google-genai SDK directly — audio output isn't something
CrewAI/LiteLLM's chat-completion interface models.
"""

from crewai import Agent, Crew, Task
from google.genai import types
from pydantic import BaseModel

from app.agents.gemini_client import GEMINI_TTS_MODEL_NAME, generate_content, pcm_to_wav_base64
from app.agents.llm import get_llm
from app.models.lesson import HinglishContent, Lesson
from app.services.cache import AsyncTTLCache

# A lesson's Hinglish text+TTS audio is deterministic per lesson (content
# doesn't change once generated) and TTS is the most expensive step here —
# backstop cache in case a lesson is requested again before the DB-level
# check (routes/lessons.py::generate_hinglish reads lesson.hinglish first)
# catches it, e.g. a retried request racing the DB write.
_hinglish_cache = AsyncTTLCache(maxsize=512, ttl=7 * 24 * 60 * 60)


class HinglishTextSchema(BaseModel):
    text: str


def build_hinglish_agent() -> Agent:
    return Agent(
        role="Hinglish Teacher",
        goal=(
            "Explain lesson content in simple, natural Hinglish (Hindi+English mix) for "
            "students more comfortable with partial English fluency."
        ),
        backstory=(
            "You are a patient tutor who explains technical topics the way Indian "
            "students actually talk — a natural mix of Hindi and English, never a "
            "stiff, literal translation."
        ),
        llm=get_llm(temperature=0.6),
        verbose=False,
    )


def _lesson_text_summary(lesson: Lesson) -> str:
    lines = [lesson.title]
    for block in lesson.content:
        text = block.model_dump().get("text")
        if text:
            lines.append(text)
    return "\n".join(lines)


def _build_translation_task(agent: Agent, lesson: Lesson) -> Task:
    return Task(
        description=(
            "Explain the following lesson in simple, natural Hinglish, as if talking "
            "to a student directly. Keep technical terms in English where that's how "
            "they're normally said (e.g. 'function', 'variable'), but explain the "
            "concepts in a Hindi-English mix. Keep it concise — a few short paragraphs, "
            "not a full re-teaching of every detail.\n\n"
            f"{_lesson_text_summary(lesson)}"
        ),
        expected_output="A Hinglish explanation of the lesson, a few short paragraphs.",
        agent=agent,
        output_pydantic=HinglishTextSchema,
    )


async def generate_hinglish_text(lesson: Lesson) -> str:
    agent = build_hinglish_agent()
    task = _build_translation_task(agent, lesson)
    crew = Crew(agents=[agent], tasks=[task], verbose=False)
    await crew.kickoff_async()
    result: HinglishTextSchema = task.output.pydantic
    return result.text


async def synthesize_audio(text: str) -> str:
    """Returns base64-encoded WAV audio."""
    response = await generate_content(
        model=GEMINI_TTS_MODEL_NAME,
        contents=text,
        config=types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name="Kore")
                )
            ),
        ),
    )
    part = response.candidates[0].content.parts[0]
    return pcm_to_wav_base64(part.inline_data.data)


async def generate_hinglish_content(lesson: Lesson) -> HinglishContent:
    cached = _hinglish_cache.get(lesson.id) if lesson.id else None
    if cached is not None:
        return cached

    text = await generate_hinglish_text(lesson)
    audio_base64 = await synthesize_audio(text)
    content = HinglishContent(text=text, audio_base64=audio_base64)

    if lesson.id:
        _hinglish_cache.set(lesson.id, content)
    return content
