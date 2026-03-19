"""
Coding Agent - Helps students with programming tasks, debugging, and algorithms.
"""

from __future__ import annotations
import logging
from typing import AsyncIterator
from app.llm.factory import get_llm_provider
from app.utils.code_runner import execute_code

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
        logger.info(f"Generating raw {language} code for prompt: {prompt[:50]}...")
        sys_prompt = f"You are an expert AI programmer. The user needs {language} code. Output ONLY valid {language} code. Do not use markdown blocks (no ```). Do not include any explanations, conversational text, or file names. Your entire response must be valid {language} code that can be executed as-is."
        messages = [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": prompt}
        ]
        try:
            raw_response = await self.llm.generate(messages)
            
            # Strip markdown code blocks if the LLM included them despite instructions
            code = raw_response.strip()
            if code.startswith("```"):
                # Remove first line if it's ```lang
                lines = code.splitlines()
                if lines[0].startswith("```"):
                    lines = lines[1:]
                # Remove last line if it's ```
                if lines and lines[-1].startswith("```"):
                    lines = lines[:-1]
                code = "\n".join(lines).strip()
            
            logger.info(f"Successfully generated {len(code)} characters of code.")
            return code
        except Exception as e:
            logger.error(f"CodingAgent raw code generation failed: {e}")
            raise

    async def transform_code(self, code: str, language: str, action: str) -> str:
        """Transforms code (debug/optimize) and returns pure code for diffing."""
        logger.info(f"Transforming {language} code. Action: {action}")
        
        actions = {
            "debug": "Find and fix any errors or bugs in this code. Output ONLY the corrected code.",
            "optimize": "Optimize this code for better performance, memory usage, and readability. Output ONLY the optimized code."
        }
        
        instruction = actions.get(action, "Improve this code.")
        sys_prompt = f"You are an expert AI programmer. {instruction} Output ONLY valid {language} code. Do not use markdown blocks (no ```). Do not include any explanations or conversational text. Your entire response must be valid {language} code."
        
        messages = [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": f"Here is the {language} code:\n\n{code}"}
        ]
        
        try:
            raw_response = await self.llm.generate(messages)
            
            # Use the same stripping logic as generate_raw_code
            clean_code = raw_response.strip()
            if clean_code.startswith("```"):
                lines = clean_code.splitlines()
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].startswith("```"):
                    lines = lines[:-1]
                clean_code = "\n".join(lines).strip()
                
            return clean_code
        except Exception as e:
            logger.error(f"CodingAgent transform failed: {e}")
            raise

    async def run_code(self, code: str, language: str) -> dict:
        """Executes code via local subprocess runner."""
        try:
            return await execute_code(code, language)
        except Exception as e:
            logger.error(f"Code execution failed: {e}")
            return {"stdout": "", "stderr": str(e), "code": -1}
