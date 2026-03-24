"""
Gemini LLM provider — implements the LLMProvider interface for Google Generative AI.
"""

import asyncio
import logging
import re
import google.generativeai as genai
from typing import List, Dict, Any, AsyncIterator

from app.llm.base import LLMProvider
from app.core.config import get_settings

logger = logging.getLogger(__name__)

_MAX_RETRIES = 3
_BASE_RETRY_DELAY = 10.0  # seconds


def _parse_retry_delay(error_str: str) -> float:
    """Extract suggested retry delay from a 429 error message, or return None."""
    match = re.search(r"retry_delay\s*\{\s*seconds:\s*(\d+)", error_str)
    if match:
        return float(match.group(1)) + 2  # add 2s buffer
    return None


class GeminiProvider(LLMProvider):
    """
    Provider implementation for Google Gemini models.
    Includes automatic exponential-backoff retry on 429 rate-limit errors.
    """

    def __init__(self, is_secondary: bool = False):
        settings = get_settings()
        api_key = settings.GEMINI_SECONDARY_API_KEY if is_secondary else settings.GEMINI_API_KEY
        
        # Fallback to primary if secondary is missing
        if is_secondary and not api_key:
            api_key = settings.GEMINI_API_KEY
            
        genai.configure(api_key=api_key)
        self.model_name = settings.LLM_MODEL or "gemini-1.5-flash"
        self.model = genai.GenerativeModel(self.model_name)

    async def generate(self, messages: List[Dict[str, str]], **kwargs) -> str:
        """Generate a text response from Gemini, with retry on 429."""
        contents = self._convert_to_gemini_format(messages)
        last_error = None

        for attempt in range(1, _MAX_RETRIES + 1):
            try:
                logger.info(
                    f"Generating Gemini response for model: {self.model_name}"
                    + (f" (attempt {attempt}/{_MAX_RETRIES})" if attempt > 1 else "")
                )
                response = await self.model.generate_content_async(contents)

                if not response.text:
                    logger.warning("Gemini returned an empty response.")
                    return ""

                return response.text.strip()

            except Exception as e:
                error_str = str(e)
                if "429" in error_str and attempt < _MAX_RETRIES:
                    # Rate-limited — wait and retry
                    delay = _parse_retry_delay(error_str) or (_BASE_RETRY_DELAY * (2 ** (attempt - 1)))
                    logger.warning(
                        f"Gemini 429 rate limit hit (attempt {attempt}/{_MAX_RETRIES}). "
                        f"Retrying in {delay:.1f}s..."
                    )
                    await asyncio.sleep(delay)
                    last_error = e
                else:
                    logger.error(f"Gemini generation failed: {e}")
                    raise RuntimeError(f"Gemini Error: {error_str}")

        logger.error(f"Gemini generation failed after {_MAX_RETRIES} retries: {last_error}")
        raise RuntimeError(f"Gemini Error (after {_MAX_RETRIES} retries): {str(last_error)}")

    async def stream(self, messages: List[Dict[str, str]]) -> AsyncIterator[str]:
        """Stream response tokens from Gemini."""
        contents = self._convert_to_gemini_format(messages)
        try:
            logger.info(f"Streaming Gemini response for model: {self.model_name}")
            response = await self.model.generate_content_async(contents, stream=True)
            async for chunk in response:
                try:
                    if chunk.text:
                        yield chunk.text
                except ValueError:
                    # chunk.text raises ValueError if chunk has no valid parts
                    continue
        except Exception as e:
            logger.error(f"Gemini streaming failed: {e}")
            raise RuntimeError(f"Gemini Error: {str(e)}")

    def _convert_to_gemini_format(self, messages: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        """
        Convert standard role/content messages to Gemini contents format.
        Gemini roles: 'user' or 'model' (assistant).
        """
        gemini_messages = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")

            # Gemini SDK roles: 'user', 'model'
            gemini_role = "user" if role in ["user", "system"] else "model"

            if role == "system":
                gemini_messages.append({
                    "role": "user",
                    "parts": [{"text": f"System Instruction: {content}"}]
                })
            else:
                gemini_messages.append({
                    "role": gemini_role,
                    "parts": [{"text": content}]
                })
        return gemini_messages

    def get_token_count(self, text: str) -> int:
        """Estimate token count."""
        return len(text) // 4

