"""
Session service — CRUD for chat sessions.
"""

from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.message import Message
from app.models.session import ChatSession
from app.utils.exceptions import NotFoundError

logger = logging.getLogger(__name__)


async def create_session(
    user_id: int,
    title: str,
    db: AsyncSession,
    module: str = "chat",
) -> ChatSession:
    """Create a new chat session for a user."""
    session = ChatSession(user_id=user_id, title=title, module=module)
    db.add(session)
    await db.flush()
    await db.refresh(session)
    logger.info("Created session id=%d for user=%d", session.id, user_id)
    return session


async def list_sessions(
    user_id: int,
    db: AsyncSession,
    module: str | None = None,
) -> list[ChatSession]:
    """Return all sessions for a user, newest first. Optional module filter."""
    query = select(ChatSession).where(ChatSession.user_id == user_id)
    if module:
        query = query.where(ChatSession.module == module)
    
    result = await db.execute(query.order_by(ChatSession.created_at.desc()))
    return list(result.scalars().all())


async def get_session_messages(
    session_id: int,
    user_id: int,
    db: AsyncSession,
) -> list[Message]:
    """Return all messages for a session (with ownership check)."""
    result = await db.execute(
        select(ChatSession)
        .options(selectinload(ChatSession.messages))
        .where(ChatSession.id == session_id, ChatSession.user_id == user_id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise NotFoundError("Session not found")
    return list(session.messages)


async def delete_session(
    session_id: int,
    user_id: int,
    db: AsyncSession,
) -> None:
    """Delete a session (cascades to messages)."""
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.id == session_id, ChatSession.user_id == user_id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise NotFoundError("Session not found")
    await db.delete(session)
    logger.info("Deleted session id=%d for user=%d", session_id, user_id)


async def update_session(
    session_id: int,
    user_id: int,
    title: str,
    db: AsyncSession,
) -> ChatSession:
    """Update a session's title (with ownership check)."""
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.id == session_id, ChatSession.user_id == user_id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise NotFoundError("Session not found")

    session.title = title
    await db.flush()
    await db.refresh(session)
    logger.info("Updated session id=%d title to '%s'", session_id, title)
    return session


async def truncate_session(
    session_id: int,
    user_id: int,
    message_index: int,
    db: AsyncSession,
) -> None:
    """Delete messages from a certain index onwards (with ownership check)."""
    # 1. Verify ownership and get session
    result = await db.execute(
        select(ChatSession)
        .options(selectinload(ChatSession.messages))
        .where(ChatSession.id == session_id, ChatSession.user_id == user_id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise NotFoundError("Session not found")

    # 2. Identify messages to delete
    # We sort by timestamp to match the display order
    sorted_messages = sorted(session.messages, key=lambda m: m.timestamp)
    
    if message_index < 0 or message_index >= len(sorted_messages):
        return # Nothing to do or invalid index

    to_delete = sorted_messages[message_index:]
    
    for msg in to_delete:
        await db.delete(msg)
    
    await db.flush()
    logger.info("Truncated session id=%d from index %d", session_id, message_index)

