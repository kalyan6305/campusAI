"""
Groq LLM provider — implements the LLMProvider interface for Groq Cloud API.
"""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
import httpx
import json

from app.llm.base import LLMProvider
from app.core.config import get_settings

logger = logging.getLogger(__name__)

class GroqProvider(LLMProvider):
    """
    Provider implementation for Groq using their OpenAI-compatible API.
    """

    def __init__(self):
        settings = get_settings()
        self.api_key = settings.GROQ_API_KEY
        self.model_name = settings.LLM_MODEL or "llama-3.3-70b-versatile"
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"

    async def generate(self, messages: list[dict]) -> str:
        """Generate a text response from Groq."""
        payload = {
            "model": self.model_name,
            "messages": messages,
            "stream": False
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(self.base_url, json=payload, headers=headers)
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            logger.error(f"Groq generation failed: {e}")
            raise RuntimeError(f"Groq Error: {str(e)}")

    async def stream(self, messages: list[dict]) -> AsyncIterator[str]:
        """Stream response tokens from Groq."""
        payload = {
            "model": self.model_name,
            "messages": messages,
            "stream": True
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream("POST", self.base_url, json=payload, headers=headers) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if not line or not line.startswith("data: "):
                            continue
                        
                        chunk_str = line[6:] # Strip "data: "
                        if chunk_str == "[DONE]":
                            break
                        
                        try:
                            chunk_data = json.loads(chunk_str)
                            delta = chunk_data["choices"][0].get("delta", {})
                            if "content" in delta:
                                yield delta["content"]
                        except json.JSONDecodeError:
                            logger.warning(f"Failed to decode Groq stream chunk: {chunk_str}")
        except Exception as e:
            logger.error(f"Groq streaming failed: {e}")
            raise RuntimeError(f"Groq Error: {str(e)}")
