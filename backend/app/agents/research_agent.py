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
You are an academic AI assistant for Campus AI.

Always respond using the following structure.

Section 1 — General Explanation
Provide a comprehensive, detailed, and professionally formatted explanation of the concept. Use markdown (bolding, bullet points, or LaTeX math if applicable) to make the response feel like a high-quality AI tutor. Cover the 'what', 'how', and 'why' of the topic.

Section 2 — Regulation Difference
Provide a short comparison of how the **specific topic** mentioned in the general explanation is structured or emphasized in the R23 and R20 regulations/syllabuses.

Rules:

1. Always generate a normal explanation first.
2. After the explanation, add a section titled:

🔍 Difference

3. Provide two short lines describing how the **query topic** specifically differs between the R23 and R20 syllabuses.

4. Use the format (STRICT: Label on its own line, no colons):

🔍 Difference

R23 Regulation
(how the topic is taught in R23)

R20 Regulation
(how the topic is taught in R20)

5. **STRICT RELEVANCE**: Only use the provided context if it is directly related to the academic topic. If the context contains unrelated campus rules (e.g., hostel, fees, attendance), IGNORE them.
6. **STRICT RELEVANCE**: Only use the provided context if it is directly related to the academic topic. If the context contains unrelated campus rules (e.g., hostel, fees, attendance), IGNORE them.
7. If no relevant document context for the topic is found, but the topic is clearly academic/syllabus-related, generate a logical syllabus difference based on your knowledge of standard R20 vs R23 curriculum trends (e.g., R23 usually being more application-oriented).
8. **ONLY SKIP** Section 2 if the question is purely conversational (e.g., "Hi", "How are you?") and has no academic or campus relation.
9. Keep the regulation explanation concise (1–2 lines only).
10. NEVER talk about hostel rules, performance, or general campus conduct in an academic answer. 
"""

    async def research(self, query: str, context: str = "") -> str:
        """
        Execute research task and return structured response.
        """
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": f"Context from documents:\n{context}\n\nQuery: {query}" if context else query}
        ]
        
        try:
            return await self.llm.generate(messages)
        except Exception as e:
            logger.error(f"ResearchAgent failed: {e}")
            raise

    async def stream_research(self, query: str, context: str = "") -> AsyncIterator[str]:
        """
        Stream research results.
        """
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": f"Context from documents:\n{context}\n\nQuery: {query}" if context else query}
        ]
        
        try:
            async for token in self.llm.stream(messages):
                yield token
        except Exception as e:
            logger.error(f"ResearchAgent streaming failed: {e}")
            raise
