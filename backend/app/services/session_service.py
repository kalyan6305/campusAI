"""
Session service — CRUD for chat sessions.
"""

from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import (
    ChatSession, ChatMessage,
    CampusSession, CampusMessage,
    ToolsSession, ToolsMessage,
    AgentsSession, AgentsMessage
)
from app.utils.exceptions import NotFoundError

logger = logging.getLogger(__name__)

MODEL_MAP = {
    "chat": (ChatSession, ChatMessage),
    "campus": (CampusSession, CampusMessage),
    "tools": (ToolsSession, ToolsMessage),
    "agents": (AgentsSession, AgentsMessage),
}

def _get_models(module: str = "chat"):
    """Helper to return (SessionModel, MessageModel) for a given module."""
    if module in MODEL_MAP:
        return MODEL_MAP[module]
        
    # Fallback for dynamic agent modes to 'agents' table
    if module in ["career", "academic", "research", "coding", "analysis", "current_affairs"]:
        return MODEL_MAP["agents"]
    
    # Fallback for campus sub-modules to 'campus' table
    if module in ["academics", "bus services", "hostel", "events", "canteen", "library", "exam", "placement"]:
        return MODEL_MAP["campus"]

    logger.warning("Unknown module '%s' requested, falling back to 'chat' table", module)
    return MODEL_MAP["chat"]


async def create_session(
    user_id: int,
    title: str,
    db: AsyncSession,
    module: str = "chat",
) -> ChatSession:
    """Create a new session for a user in the appropriate table."""
    SessionModel, _ = _get_models(module)
    session = SessionModel(user_id=user_id, title=title)
    if hasattr(session, 'module'): # Only ChatSession has this legacy column
        session.module = module
        
    db.add(session)
    await db.flush()
    await db.refresh(session)
    logger.info("Created %s session id=%d for user=%d", module, session.id, user_id)
    return session


async def list_sessions(
    user_id: int,
    db: AsyncSession,
    module: str = "chat",
) -> list[ChatSession]:
    """Return all sessions for a user from the appropriate table."""
    SessionModel, _ = _get_models(module)
    query = select(SessionModel).where(SessionModel.user_id == user_id)
    
    # For the legacy 'chat' module, we still need to filter by the 'module' column
    # because the 'chat_sessions' table might contain old data from other modules.
    if SessionModel == ChatSession and hasattr(ChatSession, 'module'):
        query = query.where(ChatSession.module == "chat")
    
    result = await db.execute(query.order_by(SessionModel.created_at.desc()))
    return list(result.scalars().all())


async def get_session_messages(
    session_id: int,
    user_id: int,
    db: AsyncSession,
    module: str = "chat",
) -> list[ChatMessage]:
    """Return all messages for a session (with ownership check) from the appropriate table."""
    SessionModel, _ = _get_models(module)
    result = await db.execute(
        select(SessionModel)
        .options(selectinload(SessionModel.messages))
        .where(SessionModel.id == session_id, SessionModel.user_id == user_id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise NotFoundError(f"{module.capitalize()} session not found")
    return list(session.messages)


async def delete_session(
    session_id: int,
    user_id: int,
    db: AsyncSession,
    module: str = "chat",
) -> None:
    """Delete a session from the appropriate table."""
    SessionModel, _ = _get_models(module)
    result = await db.execute(
        select(SessionModel)
        .where(SessionModel.id == session_id, SessionModel.user_id == user_id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise NotFoundError(f"{module.capitalize()} session not found")
    await db.delete(session)
    logger.info("Deleted %s session id=%d for user=%d", module, session_id, user_id)


async def update_session(
    session_id: int,
    user_id: int,
    title: str,
    db: AsyncSession,
    module: str = "chat",
) -> ChatSession:
    """Update a session's title in the appropriate table."""
    SessionModel, _ = _get_models(module)
    result = await db.execute(
        select(SessionModel)
        .where(SessionModel.id == session_id, SessionModel.user_id == user_id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise NotFoundError(f"{module.capitalize()} session not found")

    session.title = title
    await db.flush()
    await db.refresh(session)
    logger.info("Updated %s session id=%d title to '%s'", module, session_id, title)
    return session


async def truncate_session(
    session_id: int,
    user_id: int,
    message_index: int,
    db: AsyncSession,
    module: str = "chat",
) -> None:
    """Delete messages from a certain index onwards from the appropriate table."""
    SessionModel, MessageModel = _get_models(module)
    
    result = await db.execute(
        select(SessionModel)
        .options(selectinload(SessionModel.messages))
        .where(SessionModel.id == session_id, SessionModel.user_id == user_id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise NotFoundError(f"{module.capitalize()} session not found")

    # 2. Identify messages to delete
    sorted_messages = sorted(session.messages, key=lambda m: m.timestamp)
    
    if message_index < 0 or message_index >= len(sorted_messages):
        return # Nothing to do or invalid index

    to_delete = sorted_messages[message_index:]
    
    for msg in to_delete:
        await db.delete(msg)
    
    await db.flush()
    logger.info("Truncated %s session id=%d from index %d", module, session_id, message_index)

