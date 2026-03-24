"""
ResearchAgent — academic/technical research assistant with multi-mode support.
Modes: topic | paper_analysis | project_ideas | writing_assistance
"""

from __future__ import annotations

import logging
from typing import AsyncIterator
from app.llm.factory import get_llm_provider

logger = logging.getLogger(__name__)

# ── Mode-specific system prompts ──────────────────────────────────────────────

_TOPIC_PROMPT = """
You are a Research & Academic AI Analyst. 
Provide a concise, direct explanation of the topic. 
Use bolding for key terms and lists for clear structure. 
No preamble, no fillers, no confidence block.
""".strip()

_PAPER_PROMPT = """
You are a Research Paper Analysis AI. 
Analyze the provided text concisely. 
Focus on core problems, methodology, results, and critical limitations. 
No preamble, no fillers, no confidence block.
""".strip()

_PROJECT_IDEAS_PROMPT = """
You are a Project Idea Generator. 
Generate concise, creative, feasible project ideas. 
For each: Title, 1-sentence description, Tech/Skills, and Difficulty. 
No preamble, no fillers, no confidence block.
""".strip()

_WRITING_PROMPT = """
You are an Academic Writing Assistant. 
Generate concise academic content (Abstracts, Intros, Outlines). 
Focus on logical structure and formal language. 
No preamble, no fillers, no confidence block.
""".strip()

MODE_PROMPTS = {
    "topic": _TOPIC_PROMPT,
    "paper_analysis": _PAPER_PROMPT,
    "project_ideas": _PROJECT_IDEAS_PROMPT,
    "writing_assistance": _WRITING_PROMPT,
}


class ResearchAgent:
    """
    Agent responsible for academic research — supports 4 modes:
    topic | paper_analysis | project_ideas | writing_assistance
    """

    def __init__(self):
        self.llm = get_llm_provider()
        # Legacy system prompt — kept for backward compatibility (chat_service.py fallback)
        self.system_prompt = _TOPIC_PROMPT

    def _get_system_prompt(self, mode: str) -> str:
        return MODE_PROMPTS.get(mode, _TOPIC_PROMPT)

    # ── Legacy methods (used by chat_service.py) ──────────────────────────────

    async def research(self, query: str, context: str = "", web_context: str = "") -> str:
        """Execute research task and return structured response (non-streaming)."""
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
        """Stream research results (used by chat_service.py fallback)."""
        full_context = ""
        if context:
            full_context += f"Academic/Document Context:\n{context}\n\n"
        if web_context:
            full_context += f"Initial Web Search Context:\n{web_context}\n\n"

        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": f"CURRENT GOAL: {query}\n\nContext:\n{full_context}" if full_context else f"CURRENT GOAL: {query}"}
        ]

        try:
            async for token in self.llm.stream(messages):
                yield token
        except Exception as e:
            logger.error(f"ResearchAgent streaming failed: {e}")
            raise

    # ── New mode-aware streaming method (used by research_router.py) ─────────

    async def stream_mode(self, mode: str, query: str, document_text: str = "") -> AsyncIterator[str]:
        """
        Stream a response for a specific research mode.

        Args:
            mode: One of 'topic' | 'paper_analysis' | 'project_ideas' | 'writing_assistance'
            query: The user's query or topic
            document_text: Extracted text from an uploaded document (for paper_analysis mode)
        """
        system_prompt = self._get_system_prompt(mode)

        if mode == "paper_analysis" and document_text:
            user_content = (
                f"Analyze the following research paper:\n\n"
                f"--- PAPER TEXT START ---\n{document_text[:12000]}\n--- PAPER TEXT END ---\n\n"
                f"Additional focus (if any): {query}" if query else
                f"Analyze the following research paper:\n\n"
                f"--- PAPER TEXT START ---\n{document_text[:12000]}\n--- PAPER TEXT END ---"
            )
        elif mode == "paper_analysis" and not document_text:
            user_content = f"Analyze this research paper/concept based on the description:\n\n{query}"
        else:
            user_content = query

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ]

        try:
            async for token in self.llm.stream(messages):
                yield token
        except Exception as e:
            logger.error(f"ResearchAgent stream_mode({mode}) failed: {e}")
            raise
