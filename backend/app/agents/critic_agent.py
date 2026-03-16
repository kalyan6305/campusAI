"""
Critic Agent - Reviews agent output for quality and accuracy.
"""

from __future__ import annotations
import logging
from app.llm.factory import get_llm_provider

logger = logging.getLogger(__name__)

class CriticAgent:
    def __init__(self):
        self.llm = get_llm_provider()

    async def review(self, output: str, context: str) -> str:
        """Review the output and suggest improvements or fix minor issues."""
        prompt = f"""
        You are a Quality Control Critic for a professional resume service. 
        Review the following optimized resume and ensure it meets high standards:
        - No hallucinations or placeholder text (like [Company Name]).
        - Professional tone and formatting.
        - High impact verbs and quantified achievements where possible.
        
        Original Context (JD/Resume Info):
        {context}
        
        Output to Review:
        {output}
        
        If the output is good, return it as is. If it needs minor fixes, fix them and return the improved version.
        """
        messages = [{"role": "user", "content": prompt}]
        return await self.llm.generate(messages)
