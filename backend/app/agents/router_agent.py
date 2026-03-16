"""
Router Agent - Directs user queries to the appropriate specialized agent.
"""

from __future__ import annotations
import logging
from app.llm.factory import get_llm_provider

logger = logging.getLogger(__name__)

class RouterAgent:
    def __init__(self):
        self.llm = get_llm_provider()

    async def route(self, query: str) -> str:
        """Determine which agent should handle the query."""
        # Routing logic
        q = query.lower()
        if any(word in q for word in ["resume", "cv", "job description", "optimize"]):
            return "resume_agent"
        if any(word in q for word in ["code", "debug", "python", "java", "script", "algorithm", "programming", "develop"]):
            return "coding_agent"
        
        return "research_agent" # Default
