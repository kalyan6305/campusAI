"""
Coding Agent - Helps students with programming tasks, debugging, and algorithms.
"""

from __future__ import annotations
import logging
import httpx
from typing import Dict, List, Any, AsyncIterator
from app.llm.factory import get_llm_provider

logger = logging.getLogger(__name__)

class CodingAgent:
    def __init__(self):
        self.llm = get_llm_provider()
        self.system_prompt = """
You are an expert AI Coding Agent for Campus AI, designed to help students with programming tasks.

Your core capabilities:
1. **Code Generation**: Provide clean, well-structured code with helpful comments.
2. **Code Explanation**: Explain code logic step-by-step in simple terms.
3. **Debugging Support**: Identify errors in code snippets and provide corrected versions with explanations.
4. **Algorithm Guidance**: Explain algorithms and data structures with examples and pseudocode.
5. **Project Assistance**: Generate starter templates for various project types (FastAPI, REST APIs, ML models, etc.).

Guidelines:
- Always use proper markdown formatting for code blocks.
- Suggest best practices and explain the "why" behind the code.
- Be supportive and educational, helping students learn while solving their problems.
- If a specific language is not mentioned, default to Python but support all major languages (Java, C++, JS, etc.).
"""

    async def generate_response(self, query: str) -> str:
        """Generates a non-streaming response for coding queries."""
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": query}
        ]
        try:
            return await self.llm.generate(messages)
        except Exception as e:
            logger.error(f"CodingAgent failed: {e}")
            raise

    async def stream_response(self, query: str) -> AsyncIterator[str]:
        """Streams the response for coding queries."""
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": query}
        ]
        try:
            async for token in self.llm.stream(messages):
                yield token
        except Exception as e:
            logger.error(f"CodingAgent streaming failed: {e}")
            raise

    async def generate_raw_code(self, prompt: str, language: str) -> str:
        """Generates pure code for editor insertion without markdown formatting."""
        sys_prompt = f"You are an expert AI programmer. The user needs {language} code. Output ONLY valid {language} code. Do not use markdown blocks (no ```). Do not include any explanations, conversational text, or file names. Your entire response must be valid {language} code that can be executed as-is."
        messages = [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": prompt}
        ]
        try:
            return await self.llm.generate(messages)
        except Exception as e:
            logger.error(f"CodingAgent raw code generation failed: {e}")
            raise

    async def run_code(self, code: str, language: str) -> dict:
        """Executes code via the Piston API and returns the output."""
        LANG_MAP = {
            'python': {'language': 'python', 'version': '3.10.0'},
            'javascript': {'language': 'javascript', 'version': '1.32.3'},
            'java': {'language': 'java', 'version': '15.0.2'},
            'cpp': {'language': 'c++', 'version': '10.2.0'},
        }
        lang_config = LANG_MAP.get(language)
        if not lang_config:
            return {"stdout": "", "stderr": f"Language '{language}' is not supported for execution.", "code": -1}

        payload = {
            "language": lang_config["language"],
            "version": lang_config["version"],
            "files": [{"content": code}]
        }
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post("https://emkc.org/api/v2/piston/execute", json=payload)
                resp.raise_for_status()
                data = resp.json()
                run = data.get("run", {})
                return {
                    "stdout": run.get("output", ""),
                    "stderr": run.get("stderr", ""),
                    "code": run.get("code", 0)
                }
        except httpx.HTTPStatusError as e:
            logger.error(f"Piston API error: {e}")
            return {"stdout": "", "stderr": f"Execution service error: {e.response.status_code}", "code": -1}
        except Exception as e:
            logger.error(f"Code execution failed: {e}")
            return {"stdout": "", "stderr": str(e), "code": -1}
