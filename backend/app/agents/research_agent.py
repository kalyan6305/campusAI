"""
ResearchAgent — focuses on academic/technical research and regulation comparisons.
"""

from __future__ import annotations

import logging
from typing import AsyncIterator
from app.llm.factory import get_llm_provider

logger = logging.getLogger(__name__)

class ResearchAgent:
    """
    Agent responsible for academic research and syllabus-specific comparisons.
    """

    def __init__(self):
        self.llm = get_llm_provider()
        self.system_prompt = """
You are a high-level Research & Academic AI Analyst for Campus AI.

Your goal is to provide comprehensive, detailed, and professionally formatted explanations of the search queries or concepts provided by the user.

Rules:
1. **General Explanation**: Provide a deep-dive analysis of the topic. Use markdown (bolding, headers, bullet points, or LaTeX math if applicable) to make the response highly readable and tutoring-like.
2. **Structure**: Cover the 'what', 'how', and 'why' of the topic clearly.
3. **Context Usage**: Use the provided search results and academic context to ground your answer in factual, up-to-date data. If information is missing from context, use your internal knowledge to provide a complete answer.
4. **Professionalism**: Maintain a helpful, academic, yet accessible tone. Avoid filler or conversational fluff at the beginning or end of your explanation.
5. **STRICT RELEVANCE**: Only focus on the user's research query. Do not talk about hostel rules, performance, or unrelated campus conduct.
6. **CONFIDENCE SCORE**: At the very end of EVERY response, append a confidence block in EXACTLY this format (no deviations):

:::confidence
SCORE: <number between 60 and 99>%
- <short point explaining what makes this answer reliable, e.g. "Based on widely documented academic sources">
- <short point about any uncertainty or limitation, e.g. "Some implementation details may vary by version">
- <short point about data freshness or scope, e.g. "Core concepts are stable and well-established">
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
