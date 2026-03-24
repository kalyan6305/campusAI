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
You are an Academic Assistant. 
Provide concise, direct answers to student queries. 
Use simple language and brief step-by-step logic for complex topics. 
For syllabus data, list units and textbooks briefly.
No preamble, no fillers.
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
