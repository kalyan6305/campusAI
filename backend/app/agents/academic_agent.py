"""
Academic Agent.
"""

from __future__ import annotations

import logging
from typing import AsyncIterator
from app.llm.factory import get_llm_provider

logger = logging.getLogger(__name__)

class AcademicAgent:
    """
    Agent responsible for academic assistance and tutoring.
    Uses RAG chunks as syllabus context.
    """

    def __init__(self):
        self.llm = get_llm_provider()
        self.system_prompt = """
You are an intelligent Academic Agent for Campus AI, acting as a personal tutor for students.

Your role:
Assist students with academic learning, subject explanations, syllabus understanding, and exam preparation.

Instructions:
1. Explain difficult topics in simple language.
2. Provide step-by-step breakdowns for complex logic or algorithms.
3. Use examples when possible, and real-world analogies if applicable.
4. Include a short summary at the end if the explanation is long.
5. If the question relates to the provided syllabus context, extract specific details from it. If outside the syllabus, answer using your general knowledge confidently.
6. Proactively provide study suggestions when applicable (e.g., "You should study these topics next" or "This concept is important for exams").
"""

    async def generate_response(self, query: str, rag_context: str = "") -> str:
        """
        Executes tutoring query.
        """
        full_context = ""
        if rag_context:
            full_context += f"--- Academic Syllabus Concept Extraction ---\n{rag_context}\n\n"

        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": f"{full_context}Student Query: {query}"}
        ]
        
        try:
            return await self.llm.generate(messages)
        except Exception as e:
            logger.error(f"AcademicAgent failed: {e}")
            raise

    async def stream_response(self, query: str, rag_context: str = "") -> AsyncIterator[str]:
        """
        Streams tutoring response.
        """
        full_context = ""
        if rag_context:
            full_context += f"--- Academic Syllabus Concept Extraction ---\n{rag_context}\n\n"

        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": f"{full_context}Student Query: {query}"}
        ]
        
        try:
            async for token in self.llm.stream(messages):
                yield token
        except Exception as e:
            logger.error(f"AcademicAgent streaming failed: {e}")
            raise
