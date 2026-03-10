"""
Voice service — session CRUD and LLM streaming for voice conversations.
"""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.llm.factory import get_llm_provider
from app.models.voice_message import VoiceMessage
from app.models.voice_session import VoiceSession
from app.utils.exceptions import LLMError, NotFoundError
from app.rag import rag_service
from app.agents.research_agent import ResearchAgent

logger = logging.getLogger(__name__)


# ── Session CRUD ──────────────────────────────────────


async def create_voice_session(
    user_id: int,
    title: str,
    db: AsyncSession,
) -> VoiceSession:
    """Create a new voice session for a user."""
    session = VoiceSession(user_id=user_id, title=title)
    db.add(session)
    await db.flush()
    await db.refresh(session)
    logger.info("Created voice session id=%d for user=%d", session.id, user_id)
    return session


async def list_voice_sessions(
    user_id: int,
    db: AsyncSession,
) -> list[VoiceSession]:
    """Return all voice sessions for a user, newest first."""
    result = await db.execute(
        select(VoiceSession)
        .where(VoiceSession.user_id == user_id)
        .order_by(VoiceSession.created_at.desc())
    )
    return list(result.scalars().all())


async def get_voice_session_messages(
    session_id: int,
    user_id: int,
    db: AsyncSession,
) -> list[VoiceMessage]:
    """Return all messages for a voice session (with ownership check)."""
    result = await db.execute(
        select(VoiceSession)
        .options(selectinload(VoiceSession.messages))
        .where(VoiceSession.id == session_id, VoiceSession.user_id == user_id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise NotFoundError("Voice session not found")
    return list(session.messages)


async def delete_voice_session(
    session_id: int,
    user_id: int,
    db: AsyncSession,
) -> None:
    """Delete a voice session (cascades to messages)."""
    result = await db.execute(
        select(VoiceSession)
        .where(VoiceSession.id == session_id, VoiceSession.user_id == user_id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise NotFoundError("Voice session not found")
    await db.delete(session)
    logger.info("Deleted voice session id=%d for user=%d", session_id, user_id)


# ── Voice Chat Streaming ─────────────────────────────


async def _get_voice_session_with_messages(
    session_id: int,
    user_id: int,
    db: AsyncSession,
) -> VoiceSession:
    """Fetch voice session with messages, verify ownership."""
    result = await db.execute(
        select(VoiceSession)
        .options(selectinload(VoiceSession.messages))
        .where(VoiceSession.id == session_id, VoiceSession.user_id == user_id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise NotFoundError("Voice session not found")
    return session


def _build_llm_messages(session: VoiceSession) -> list[dict]:
    """Convert ORM messages to the list[dict] format LLM providers expect."""
    return [
        {"role": msg.role, "content": msg.content}
        for msg in session.messages
    ]


async def process_voice_chat_stream(
    session_id: int,
    user_message: str,
    user_id: int,
    db: AsyncSession,
    metadata: dict = None,
) -> AsyncIterator[str]:
    """
    Streaming voice chat:
    1. Save user message to voice_messages
    2. Yield tokens from LLM
    3. Save assistant message after stream completes
    """
    session = await _get_voice_session_with_messages(session_id, user_id, db)

    user_msg = VoiceMessage(
        session_id=session_id,
        role="user",
        content=user_message,
    )
    db.add(user_msg)
    await db.flush()
    session.messages.append(user_msg)

    mode = metadata.get("mode", "voice") if metadata else "voice"
    yield {"mode": mode, "status": "START", "token": ""}

    # RAG framework check
    rag_context = await rag_service.query_knowledge_by_regulation(user_message)
    context_str = ""
    if rag_context:
        for reg, chunks in rag_context.items():
            context_str += f"\n--- {reg} Regulation ---\n" + "\n".join(chunks)

    full_reply: list[str] = []

    try:
        research_agent = ResearchAgent()
        async for token in research_agent.stream_research(user_message, context_str, ""):
            full_reply.append(token)
            yield {"mode": mode, "token": token}
    except Exception as exc:
        logger.error("Voice agent stream failed: %s", exc)
        raise LLMError(f"Voice agent stream error: {exc}") from exc

    # Persist assistant reply
    reply_text = "".join(full_reply)
    assistant_msg = VoiceMessage(
        session_id=session_id,
        role="assistant",
        content=reply_text,
    )
    db.add(assistant_msg)

    # Auto-title the session from first exchange
    if len(session.messages) <= 1:
        session.title = user_message[:80]

    await db.commit()
    logger.info("Voice stream completed: session=%d chars=%d", session_id, len(reply_text))
