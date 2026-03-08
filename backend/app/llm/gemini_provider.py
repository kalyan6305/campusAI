"""
Gemini LLM provider — implements the LLMProvider interface for Google Generative AI.
"""

import logging
import google.generativeai as genai
from typing import List, Dict, Any, AsyncIterator

from app.llm.base import LLMProvider
from app.core.config import get_settings

logger = logging.getLogger(__name__)

class GeminiProvider(LLMProvider):
    """
    Provider implementation for Google Gemini 1.5 Flash.
    """

    def __init__(self):
        settings = get_settings()
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model_name = settings.LLM_MODEL or "gemini-1.5-flash"
        self.model = genai.GenerativeModel(self.model_name)

    async def generate(self, messages: List[Dict[str, str]], **kwargs) -> str:
        """Generate a text response from Gemini."""
        contents = self._convert_to_gemini_format(messages)
        try:
            logger.info(f"Generating Gemini response for model: {self.model_name}")
            response = await self.model.generate_content_async(contents)
            
            if not response.text:
                logger.warning("Gemini returned an empty response.")
                return ""
                
            return response.text.strip()
        except Exception as e:
            logger.error(f"Gemini generation failed: {e}")
            raise RuntimeError(f"Gemini Error: {str(e)}")

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
                    # chunk.text raises ValueError if the chunk has no valid parts (e.g. finish_reason is STOP but no text)
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
            
            # If system message, prepend context to user prompt (common Gemini pattern for simple SDK usage)
            if role == "system":
                # We can either use SystemInstruction in constructor OR prepend to first user message.
                # For this implementation, we'll prepend to maintain consistency with session flows.
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
