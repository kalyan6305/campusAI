"""
Placeholder API-based LLM provider for OpenAI / Groq.

Swap this implementation once you add an API key.
"""

from __future__ import annotations

from collections.abc import AsyncIterator

from app.llm.base import LLMProvider


class APIProvider(LLMProvider):
    """
    Placeholder for cloud-hosted LLM providers (OpenAI, etc).

    To implement:
        1. Install openai SDK.
        2. Read API key from settings.
        3. Implement `generate()` and `stream()` using the SDK.
    """

    async def generate(self, messages: list[dict]) -> str:
        raise NotImplementedError(
            "APIProvider is a placeholder. "
            "Implement with OpenAI SDK when ready."
        )

    async def stream(self, messages: list[dict]) -> AsyncIterator[str]:
        raise NotImplementedError(
            "APIProvider is a placeholder. "
            "Implement with OpenAI SDK when ready."
        )
        # Make this a valid async generator for type-checker satisfaction
        yield ""  # pragma: no cover
