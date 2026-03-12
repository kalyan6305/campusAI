"""
Chat service — orchestrates message persistence and LLM calls.
"""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from typing import Any, Optional
from datetime import datetime, timezone

from sqlalchemy import select  # type: ignore
from sqlalchemy.ext.asyncio import AsyncSession  # type: ignore
from sqlalchemy.orm import selectinload  # type: ignore

from app.llm.factory import get_llm_provider  # type: ignore
from app.models.message import Message  # type: ignore
from app.models.session import ChatSession  # type: ignore
from app.utils.exceptions import LLMError, NotFoundError  # type: ignore
from app.services import rag_document_service  # type: ignore
from app.rag import rag_service  # type: ignore
from app.agents.research_agent import ResearchAgent  # type: ignore
from app.agents.career_agent import CareerAgent  # type: ignore
from app.agents.academic_agent import AcademicAgent  # type: ignore
from app.services.web_search_service import web_search_service  # type: ignore

logger = logging.getLogger(__name__)






async def _get_session_with_messages(
    session_id: int,
    user_id: int,
    db: AsyncSession,
) -> ChatSession:
    """Fetch session with messages, verify ownership."""
    result = await db.execute(
        select(ChatSession)
        .options(selectinload(ChatSession.messages))
        .where(ChatSession.id == session_id, ChatSession.user_id == user_id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise NotFoundError("Session not found")
    return session


def _build_llm_messages(session: ChatSession) -> list[dict]:
    """Convert ORM messages to the list[dict] format LLM providers expect."""
    return [
        {"role": msg.role, "content": msg.content}
        for msg in session.messages
    ]


async def process_chat(
    session_id: int,
    user_message: str,
    user_id: int,
    db: AsyncSession,
) -> Message:
    """
    1. Save user message
    2. Call LLM (non-streaming)
    3. Save and return assistant message
    """
    session = await _get_session_with_messages(session_id, user_id, db)

    # Persist user message
    user_msg = Message(
        session_id=session_id,
        role="user",
        content=user_message,
    )
    db.add(user_msg)
    await db.flush()
    session.messages.append(user_msg)

    # Call LLM
    llm = get_llm_provider()
    messages = _build_llm_messages(session)

    # RAG framework check (already present)
    rag_context = await rag_service.query_knowledge_by_regulation(user_message)
    context_str = ""
    if rag_context:
        for reg, chunks in rag_context.items():
            context_str += f"\n--- {reg} Regulation ---\n" + "\n".join(chunks)

    # Route agent based on arbitrary mode determination (currently non-stream doesn't receive metadata, defaulting to ResearchAgent for now)
    try:
        research_agent = ResearchAgent()
        reply_text = await research_agent.research(user_message, context_str)
    except Exception as exc:
        logger.error("Agent generate failed: %s", exc)
        raise LLMError(f"Agent error: {exc}") from exc

    # Persist assistant message
    assistant_msg = Message(
        session_id=session_id,
        role="assistant",
        content=reply_text,
    )
    db.add(assistant_msg)
    await db.flush()
    await db.refresh(assistant_msg)

    # Auto-title the session from first exchange
    if len(session.messages) <= 1:
        msg_str = str(user_message or "")
        session.title = msg_str[0:80]  # type: ignore
        await db.flush()
    
    await db.commit()

    logger.info("Chat processed: session=%d tokens_out=%d", session_id, len(reply_text))
    return assistant_msg


async def process_chat_stream(
    session_id: int,
    user_message: str,
    user_id: int,
    db: AsyncSession,
    metadata: Optional[Any] = None
) -> AsyncIterator[Any]:
    """
    Streaming variant:
    1. Save user message
    2. If tools mode, perform web search and yield results
    3. Yield tokens from LLM
    4. Assemble and save assistant message after stream completes
    """
    session = await _get_session_with_messages(session_id, user_id, db)

    user_msg = Message(
        session_id=session_id,
        role="user",
        content=user_message,
    )
    db.add(user_msg)
    await db.flush()
    session.messages.append(user_msg)
    
    mode = metadata.get("mode", "CHAT_MODE") if metadata else "CHAT_MODE"
    yield {"mode": mode, "status": "START", "token": ""}

    # --- Web Search for Tools Mode ---
    web_context = ""
    search_results = []
    if mode == "tools":
        # Let's signify search is happening
        yield {"mode": mode, "status": "SEARCHING", "token": ""}
        search_data = await web_search_service.search(user_message)
        search_results = search_data.get("sources", [])
        
        # Format web context for Agent with numbering
        web_context = "--- Web Search Results ---\n"
        for i, res in enumerate(search_results):
            content = res.get('snippet', '')
            if res.get('extracted_content'):
                content = res['extracted_content']
            
            web_context += f"Source [{i+1}]: {res.get('domain', res.get('source'))}\nTitle: {res['title']}\nURL: {res.get('url', res.get('link'))}\nContent: {content}\n\n"
            
        # Yield metadata to frontend for sidebar population
        logger.info("Yielding %d sources to frontend metadata", len(search_results))
        yield {"mode": mode, "status": "METADATA", "metadata": {"sources": search_results}}

    # --- RAG Injection ---
    rag_context = await rag_service.query_knowledge_by_regulation(user_message)
    context_str = ""
    if rag_context:
        for reg, chunks in rag_context.items():
            context_str += f"\n--- {reg} Regulation ---\n" + "\n".join(chunks)

    full_reply: list[str] = []

    try:
        if mode == "career":
            career_agent = CareerAgent()
            async for token in career_agent.stream_response(user_id, user_message, db):
                full_reply.append(token)
                yield {"mode": mode, "token": token}
        elif mode == "academic":
            academic_agent = AcademicAgent()
            async for token in academic_agent.stream_response(user_message, context_str):
                full_reply.append(token)
                yield {"mode": mode, "token": token}
        else:
            # Default fallback to ResearchAgent
            research_agent = ResearchAgent()
            async for token in research_agent.stream_research(user_message, context_str, web_context):
                full_reply.append(token)
                yield {"mode": mode, "token": token}
    except Exception as exc:
        logger.error("Agent stream failed: %s", exc)
        raise LLMError(f"Agent stream error: {exc}") from exc

    # Persist complete assistant reply
    reply_text = "".join(full_reply)
    assistant_msg = Message(
        session_id=session_id,
        role="assistant",
        content=reply_text,
    )
    db.add(assistant_msg)

    # Persist sources for later restoration (tools mode only)
    if mode == "tools" and search_results:
        import json as _json
        sources_json = _json.dumps(search_results, default=str)
        sources_msg = Message(
            session_id=session_id,
            role="system",
            content=f"__SOURCES__:{sources_json}",
        )
        db.add(sources_msg)

    if len(session.messages) <= 1:
        msg_final = str(user_message or "")
        session.title = msg_final[0:80]  # type: ignore

    await db.commit()
    logger.info("Stream completed: session=%d chars=%d", session_id, len(reply_text))
