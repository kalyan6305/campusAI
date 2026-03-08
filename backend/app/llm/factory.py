"""
LLM provider factory — returns the configured provider instance.
"""

from __future__ import annotations

from functools import lru_cache

from app.core.config import get_settings
from app.llm.base import LLMProvider


@lru_cache
def get_llm_provider() -> LLMProvider:
    """Instantiate and cache the active LLM provider based on config."""
    settings = get_settings()
    provider = settings.LLM_PROVIDER.lower()

    # If provider == "ollama":
    #     from app.llm.ollama_provider import OllamaProvider
    #     return OllamaProvider()

    if provider == "openai":
        from app.llm.api_provider import APIProvider
        return APIProvider()

    if provider == "gemini":
        from app.llm.gemini_provider import GeminiProvider
        return GeminiProvider()


    raise ValueError(f"Unknown LLM_PROVIDER: {provider!r}")
