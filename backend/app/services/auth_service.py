"""
Authentication service — handles registration, login, profile stats, and password resets.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, decode_access_token, hash_password, verify_password
from app.models import (
    User,
    ChatSession, ChatMessage,
    CampusSession, CampusMessage,
    ToolsSession, ToolsMessage,
    AgentsSession, AgentsMessage,
    VoiceSession, VoiceMessage
)
from app.utils.exceptions import ConflictError, ForbiddenError, AppException

logger = logging.getLogger(__name__)


async def register_user(
    email: str,
    password: str,
    db: AsyncSession,
) -> User:
    """Create a new user.  Raises ConflictError if email exists."""
    result = await db.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none() is not None:
        raise ConflictError("Email already registered")

    user = User(email=email, password_hash=hash_password(password))
    db.add(user)
    await db.flush()
    await db.refresh(user)
    logger.info("Registered user id=%d email=%s", user.id, user.email)
    return user


async def authenticate_user(
    email: str,
    password: str,
    db: AsyncSession,
) -> str:
    """Validate credentials and return a JWT access token."""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(password, user.password_hash):
        raise AppException(status_code=401, detail="Invalid email or password")

    token = create_access_token(data={"sub": str(user.id)})
    logger.info("Authenticated user id=%d", user.id)
    return token


async def get_user_stats(user_id: int, db: AsyncSession):
    """Aggregate usage statistics across all module tables."""
    # Session counts
    chat_sessions = await db.execute(select(func.count()).select_from(ChatSession).where(ChatSession.user_id == user_id))
    campus_sessions = await db.execute(select(func.count()).select_from(CampusSession).where(CampusSession.user_id == user_id))
    tools_sessions = await db.execute(select(func.count()).select_from(ToolsSession).where(ToolsSession.user_id == user_id))
    agents_sessions = await db.execute(select(func.count()).select_from(AgentsSession).where(AgentsSession.user_id == user_id))
    voice_sessions = await db.execute(select(func.count()).select_from(VoiceSession).where(VoiceSession.user_id == user_id))

    total_sessions = (
        chat_sessions.scalar() + 
        campus_sessions.scalar() + 
        tools_sessions.scalar() + 
        agents_sessions.scalar() + 
        voice_sessions.scalar()
    )

    # Message counts (joining with sessions to filter by user_id)
    chat_msgs = await db.execute(select(func.count()).select_from(ChatMessage).join(ChatSession).where(ChatSession.user_id == user_id))
    campus_msgs = await db.execute(select(func.count()).select_from(CampusMessage).join(CampusSession).where(CampusSession.user_id == user_id))
    tools_msgs = await db.execute(select(func.count()).select_from(ToolsMessage).join(ToolsSession).where(ToolsSession.user_id == user_id))
    agents_msgs = await db.execute(select(func.count()).select_from(AgentsMessage).join(AgentsSession).where(AgentsSession.user_id == user_id))
    voice_msgs = await db.execute(select(func.count()).select_from(VoiceMessage).join(VoiceSession).where(VoiceSession.user_id == user_id))

    total_messages = (
        chat_msgs.scalar() +
        campus_msgs.scalar() +
        tools_msgs.scalar() +
        agents_msgs.scalar() +
        voice_msgs.scalar()
    )

    return {
        "total_sessions": total_sessions,
        "total_messages": total_messages,
        "modules": {
            "chat": {"sessions": chat_sessions.scalar(), "messages": chat_msgs.scalar()},
            "campus": {"sessions": campus_sessions.scalar(), "messages": campus_msgs.scalar()},
            "tools": {"sessions": tools_sessions.scalar(), "messages": tools_msgs.scalar()},
            "agents": {"sessions": agents_sessions.scalar(), "messages": agents_msgs.scalar()},
            "voice": {"sessions": voice_sessions.scalar(), "messages": voice_msgs.scalar()},
        }
    }


async def create_password_reset_token(email: str, db: AsyncSession) -> str | None:
    """Generate a 1-hour signed tokens for password reset."""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        return None
        
    token = create_access_token(
        data={"sub": str(user.id), "scope": "password_reset"},
        expires_delta=timedelta(hours=1)
    )
    return token


async def update_password_with_token(token: str, new_password: str, db: AsyncSession) -> bool:
    """Verify reset token and update password."""
    payload = decode_access_token(token)
    if not payload or payload.get("scope") != "password_reset":
        raise ForbiddenError("Invalid or expired reset token")
        
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise ForbiddenError("Malformed token")
        
    user_id = int(user_id_str)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise ForbiddenError("User not found")
        
    user.password_hash = hash_password(new_password)
    db.add(user)
    await db.flush()
    await db.refresh(user)
    logger.info("Updated password for user id=%d via reset token", user.id)
    return True
