from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    mongo_uri: str = "mongodb://localhost:27017"
    mongo_db_name: str = "learnify_ai"
    cors_origins: str = "http://localhost:5173"
    log_level: str = "INFO"

    # Gemini stays wired up regardless of llm_provider — video discovery (Google
    # Search grounding), video notes (native YouTube understanding), and Hinglish
    # TTS all use the raw google-genai SDK directly and have no OpenAI equivalent.
    gemini_api_key: str = ""
    gemini_model: str = "gemini/gemini-2.5-flash"

    # llm_provider picks which model powers course/lesson text generation (course
    # planner, module generator, quiz, visual aids, tutor, Hinglish translation) —
    # Gemini's free tier exhausts in a handful of requests, so "openai" is the default.
    llm_provider: str = "openai"
    openai_api_key: str = ""
    openai_model: str = "openai/gpt-4o-mini"

    # Number of in-process asyncio workers polling the generation_jobs collection.
    job_worker_concurrency: int = 2

    # Signs auth JWTs — change this in production; rotating it logs out all users.
    jwt_secret: str = "dev-insecure-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expires_minutes: int = 60 * 24 * 7

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
