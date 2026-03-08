"""
Campus AI Operating System — FastAPI application entrypoint.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import v1_router
from app.core.config import get_settings
from app.core.logging import setup_logging
from app.db.base import Base, engine
from app.utils.exceptions import register_exception_handlers

# Ensure all models are imported so Alembic and create_all see them
from app.models import user, session, message  # noqa: F401

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle hook."""
    setup_logging()
    logger.info("Starting %s", get_settings().APP_NAME)

    # Create tables (dev convenience — use Alembic in production)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables verified")

    yield  # ← app is running

    await engine.dispose()
    logger.info("Shutdown complete")


def create_app() -> FastAPI:
    """Application factory."""
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routes ────────────────────────────────────────
    app.include_router(v1_router)

    # ── Health check ──────────────────────────────────
    @app.get("/health", tags=["Health"])
    async def health():
        return {"status": "ok", "service": settings.APP_NAME}

    # ── Exception handlers ────────────────────────────
    register_exception_handlers(app)

    return app


app = create_app()
