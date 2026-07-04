import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import close_mongo_connection, connect_to_mongo, ensure_indexes
from app.logging_config import configure_logging
from app.routes import auth, courses, health, lessons

configure_logging()
logger = logging.getLogger("app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    connect_to_mongo()
    await ensure_indexes()
    yield
    close_mongo_connection()


app = FastAPI(title="Text-to-Learn API", lifespan=lifespan)


class LogRequestsMiddleware:
    """Pure ASGI middleware — avoids BaseHTTPMiddleware's anyio task-group wrapping,
    which can corrupt the response stream when a downstream route errors out and
    turns a clean 500 into a broken connection (browser sees "Failed to fetch")."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        start = time.perf_counter()
        status_code = 0

        async def send_wrapper(message):
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message["status"]
            await send(message)

        await self.app(scope, receive, send_wrapper)
        duration_ms = (time.perf_counter() - start) * 1000
        logger.info(
            "%s %s -> %s (%.0fms)",
            scope["method"],
            scope["path"],
            status_code,
            duration_ms,
        )


app.add_middleware(LogRequestsMiddleware)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"detail": exc.errors()})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # Agent calls (Gemini/CrewAI) are the most likely source of unhandled errors here —
    # transient API failures, quota limits, or malformed output that survived retries.
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Something went wrong while processing your request."},
    )


app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(courses.router, prefix="/api")
app.include_router(lessons.router, prefix="/api")

# Starlette always places the generic-Exception handler inside ServerErrorMiddleware,
# which it puts outermost no matter when add_middleware(CORSMiddleware) is called —
# so unhandled-exception 500s never get CORS headers, and the browser reports the
# response as a network failure ("Failed to fetch") instead of a real 500. Wrapping
# the finished app object (rather than using add_middleware) puts CORS truly outside
# ServerErrorMiddleware, so every response — including unhandled 500s — gets headers.
app = CORSMiddleware(
    app,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
