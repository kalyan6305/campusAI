"""
ResearchAgent — focuses on academic/technical research and regulation comparisons.
"""

from __future__ import annotations

import logging
from typing import AsyncIterator
from app.llm.factory import get_llm_provider  # type: ignore

logger = logging.getLogger(__name__)

class ResearchAgent:
    """
    Agent responsible for academic research and syllabus-specific comparisons.
    """

    def __init__(self):
        self.llm = get_llm_provider()
        self.system_prompt = """
You are the Search Intelligence & Synthesis Layer for Campus AI, an advanced research engine similar to Perplexity.

### CRITICAL: SOURCE INTEGRITY & CITATIONS
1. **NO CONTEXT POLICY**: If the `Web Search Context` provided to you is empty, contains no relevant links, or only contains "No verified web sources found", you MUST start your response with: "NOTE: No verified web sources were found for this specific query." Then provide a summary based on your internal knowledge, but **NEVER** use numerical citations like `[1]` or `[Source]` in this case.
2. **VERIFIED SOURCES ONLY**: cite only from the provided `Web Search Context`. **NEVER** invent references or URLs.
3. **CITATIONS**: Use numerical citations `[1]`, `[2]` in the text. Do NOT include a list of references at the end.

### STYLE & STRUCTURE:
1. **Executive Summary**: Start with a high-level concise answer.
2. **Detailed Analysis**: Use ## Headers for major sections. Break down findings logically.
3. **Professional Tone**: Use academically rigorous language.

### SOURCE INTEGRITY (STRICT):
- **ONLY** use information from the provided `Web Search Context`.
- **NEVER** link to search engine result pages or homepages.
- **NEVER** invent facts, links, or references not present in the context.

### QUALITY CONTROL:
Synthesize insights (e.g., "Source [1] explains X, while Source [2] provides the implementation Y"). Do not just list snippets.

### CONFIDENCE BLOCK (MANDATORY):
At the end, append:
:::confidence
SCORE: <70-99>%
- REASONING: <brief validation of context quality>
- LIMITATIONS: <what was missing or ambiguous>
:::
"""

    async def research(self, query: str, context: str = "", web_context: str = "") -> str:
        """
        Execute research task and return structured response.
        """
        full_context = ""
        if context:
            full_context += f"Academic/Document Context:\n{context}\n\n"
        if web_context:
            full_context += f"Web Search Context:\n{web_context}\n\n"

        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": f"Context for Research:\n{full_context}\n\nQuery: {query}" if full_context else query}
        ]
        
        try:
            return await self.llm.generate(messages)
        except Exception as e:
            logger.error(f"ResearchAgent failed: {e}")
            raise

    async def stream_research(self, query: str, context: str = "", web_context: str = "") -> AsyncIterator[str]:
        """
        Stream research results.
        """
        full_context = ""
        if context:
            full_context += f"Academic/Document Context:\n{context}\n\n"
        if web_context:
            full_context += f"Web Search Context:\n{web_context}\n\n"

        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": f"Context for Research:\n{full_context}\n\nQuery: {query}" if full_context else query}
        ]
        
        try:
            async for token in self.llm.stream(messages):
                yield token
        except Exception as e:
            logger.error(f"ResearchAgent streaming failed: {e}")
            raise
