"""
Chat service — orchestrates message persistence and LLM calls.
"""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.llm.factory import get_llm_provider
from app.models.message import Message
from app.models.session import ChatSession
from app.utils.exceptions import LLMError, NotFoundError
from app.services import rag_document_service
from app.rag.rag_service import query_knowledge_by_regulation
from app.agents.research_agent import ResearchAgent

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

    # Simplified RAG check for non-streaming as well
    rag_context = await query_knowledge_by_regulation(user_message)
    context_str = ""
    if rag_context:
        for reg, chunks in rag_context.items():
            context_str += f"\n--- {reg} Regulation ---\n" + "\n".join(chunks)

    try:
        research_agent = ResearchAgent()
        reply_text = await research_agent.research(user_message, context_str)
    except Exception as exc:
        logger.error("ResearchAgent generate failed: %s", exc)
        raise LLMError(f"ResearchAgent error: {exc}") from exc

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
        session.title = user_message[:80]
        await db.flush()
    
    await db.commit()

    logger.info("Chat processed: session=%d tokens_out=%d", session_id, len(reply_text))
    return assistant_msg


async def process_chat_stream(
    session_id: int,
    user_message: str,
    user_id: int,
    db: AsyncSession,
) -> AsyncIterator[str]:
    """
    Streaming variant:
    1. Save user message
    2. Yield tokens from LLM
    3. Assemble and save assistant message after stream completes
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
    
    mode = "CHAT_MODE"
    yield {"mode": "CHAT_MODE", "status": "START", "token": ""}

    # --- RAG Injection for Standard Chat ---
    llm = get_llm_provider()
    messages = _build_llm_messages(session)
    
    # Simple semantic lookup
    rag_context = await query_knowledge_by_regulation(user_message)
    if rag_context:
        context_str = ""
        for reg, chunks in rag_context.items():
            context_str += f"\n--- {reg} Regulation ---\n" + "\n".join(chunks)
            
        rag_prompt = f"""
You have access to campus documents. If the user query is academic, use this context to provide regulation-specific details.

Context:
{context_str}

STRICT RULE: If using this context, append a section starting with 'REGULATION RESPONSE' followed by the grouped regulation cards (R23, R22, etc.).
"""
        # Insert as system instruction
        messages.insert(0, {"role": "system", "content": rag_prompt})

    full_reply: list[str] = []

    try:
        # Always use ResearchAgent to maintain Section 1 & 2 structure
        research_agent = ResearchAgent()
        async for token in research_agent.stream_research(user_message, context_str):
            full_reply.append(token)
            yield {"mode": mode, "token": token}
    except Exception as exc:
        logger.error("ResearchAgent stream failed: %s", exc)
        raise LLMError(f"ResearchAgent stream error: {exc}") from exc

    # Persist complete assistant reply
    reply_text = "".join(full_reply)
    assistant_msg = Message(
        session_id=session_id,
        role="assistant",
        content=reply_text,
    )
    db.add(assistant_msg)

    if len(session.messages) <= 1:
        session.title = user_message[:80]

    await db.commit()
    logger.info("Stream completed: session=%d chars=%d", session_id, len(reply_text))
