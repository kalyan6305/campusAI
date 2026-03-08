"""
Abstract base class for LLM providers.

All providers must implement `generate()` and `stream()`.
This abstraction allows switching between Ollama, OpenAI, Gemini,
or any other provider without changing business logic.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import AsyncIterator


class LLMProvider(ABC):
    """Interface every LLM backend must satisfy."""

    @abstractmethod
    async def generate(self, messages: list[dict]) -> str:
        """Send messages and return the full response text."""
        ...

    @abstractmethod
    async def stream(self, messages: list[dict]) -> AsyncIterator[str]:
        """Send messages and yield response tokens as they arrive."""
        ...
