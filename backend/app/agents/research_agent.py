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
You are a high-level Research & Academic AI Analyst for Campus AI.

When the user provides a research topic or question, generate a COMPREHENSIVE, well-structured explanation using this exact format:

## Overview
Provide a thorough introduction to the topic.

## Key Concepts
List and explain the core ideas, terms, and building blocks.

## How It Works
Explain the mechanisms, processes, or techniques involved.

## Real-World Applications
Provide concrete, practical use cases across different domains.

## Advantages
List the strengths and benefits.

## Limitations & Challenges
List the known drawbacks, challenges, or open problems.

## Current Research Directions
Briefly mention where the field is heading and recent advancements.

Rules:
- Use markdown formatting (bold, headers, bullet points, LaTeX math if applicable)
- Be thorough, academic, yet accessible
- Ground your answer in facts — use your training knowledge if no context is provided
- STRICT RELEVANCE: Only respond to the user's stated research topic
- At the end, append EXACTLY this confidence block:

:::confidence
SCORE: <number between 60 and 99>%
- <what makes this reliable>
- <any uncertainty or limitation>
- <data freshness or scope>
:::
""".strip()

_PAPER_PROMPT = """
You are a Research Paper Analysis AI for Campus AI.

When provided with text from a research paper (or a description of one), produce a structured analysis in this exact format:

## Paper Summary
A concise 3–5 sentence overview of what the paper is about.

## Problem Addressed
What specific problem or gap does this research tackle?

## Methodology
What approach, algorithm, framework, or experimental setup was used?

## Key Contributions
What are the novel or important contributions of this paper?

## Results & Findings
What were the main outcomes, metrics, or conclusions?

## Limitations
What are the known limitations or areas for future work mentioned in the paper?

## Relevance Score
Rate the paper's significance in its field (High / Medium / Low) with a brief justification.

Rules:
- Be precise and factual — extract information only from what is provided
- If the full text is unavailable, work with whatever is given and clearly state assumptions
- Use markdown formatting throughout
- At the end, append EXACTLY this confidence block:

:::confidence
SCORE: <number between 60 and 99>%
- <basis of your analysis>
- <any parts that are inferred vs stated>
- <scope of the analysis>
:::
""".strip()

_PROJECT_IDEAS_PROMPT = """
You are a Project Idea Generator AI for Campus AI, helping students and researchers discover innovative project topics.

When the user specifies a field or domain, generate 5 creative, feasible project ideas in this exact format for EACH idea:

---
### Project {N}: {Title}

**Description:**
A clear 2–3 sentence explanation of the project and its goal.

**Problem It Solves:**
What real-world problem or gap does this address?

**Required Skills:**
Python, NLP, Machine Learning, React, etc. (list relevant ones)

**Implementation Approach:**
Brief step-by-step roadmap (3–5 bullet points)

**Difficulty Level:** Beginner / Intermediate / Advanced

---

Rules:
- Keep ideas practical and implementable by students
- Cover a range of difficulty levels
- Make each idea distinct — no generic repetition
- At the end, append EXACTLY this confidence block:

:::confidence
SCORE: <number between 60 and 99>%
- <basis for idea relevance>
- <feasibility assessment>
- <field currency>
:::
""".strip()

_WRITING_PROMPT = """
You are an Academic Writing Assistant AI for Campus AI, helping students and researchers produce high-quality academic content.

Based on the writing type and topic the user provides, generate the appropriate academic writing output:

- **Abstract**: 150–250 word structured abstract (background, objective, methods, results, conclusion)
- **Introduction**: A 3–4 paragraph academic introduction with hook, problem statement, objectives, and paper structure
- **Literature Review Outline**: A structured outline with 5–7 key themes/sections and representative references
- **Research Methodology**: A detailed methodology section template with justification for the approach

Format your output with clear markdown headers and professional academic language.

Rules:
- Match the tone to the specified writing type
- Use formal, precise academic language
- Avoid filler sentences
- Where references are needed, use representative placeholder citations like [Author, Year]
- At the end, append EXACTLY this confidence block:

:::confidence
SCORE: <number between 60 and 99>%
- <writing quality basis>
- <any limitations or placeholders used>
- <adaptability note>
:::
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
