"""
Application configuration via pydantic-settings.
Reads from .env file at backend root.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Centralised, env-driven configuration."""

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parents[2] / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # ── App ───────────────────────────────────────────
    APP_NAME: str = "Campus AI Operating System"
    DEBUG: bool = False

    # ── Database ──────────────────────────────────────
    DATABASE_URL: str = "mysql+aiomysql://root:Uday%4012345@localhost:3306/campus_ai"

    # ── Security / JWT ────────────────────────────────
    SECRET_KEY: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 h

    # ── LLM ───────────────────────────────────────────
    LLM_PROVIDER: str = "gemini"          # ollama | openai | gemini
    LLM_MODEL: str = "gemini-1.5-flash"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    SERPER_API_KEY: str = ""
    YOUTUBE_API_KEY: str = ""

    # ── Job APIs ──────────────────────────────────────
    ADZUNA_APP_ID: str = ""
    ADZUNA_APP_KEY: str = ""
    SERPAPI_API_KEY: str = ""
    RAPIDAPI_KEY: str = ""

    # ── CORS ──────────────────────────────────────────
    CORS_ORIGINS: str = '["http://localhost:5173"]'

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse JSON string of CORS origins into a list."""
        return json.loads(self.CORS_ORIGINS)


@lru_cache
def get_settings() -> Settings:
    """Singleton settings instance (cached at process level)."""
    return Settings()
