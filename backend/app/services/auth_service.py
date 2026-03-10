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
    """Aggregate usage statistics including login streak."""
    # 1. Total Session counts
    counts = {}
    for session_cls in [ChatSession, CampusSession, ToolsSession, AgentsSession, VoiceSession]:
        res = await db.execute(select(func.count()).select_from(session_cls).where(session_cls.user_id == user_id))
        counts[session_cls.__name__] = res.scalar() or 0

    total_sessions = sum(counts.values())

    # 2. Total Message counts
    msg_counts = {}
    for msg_cls, sess_cls in [
        (ChatMessage, ChatSession), (CampusMessage, CampusSession),
        (ToolsMessage, ToolsSession), (AgentsMessage, AgentsSession),
        (VoiceMessage, VoiceSession)
    ]:
        res = await db.execute(select(func.count()).select_from(msg_cls).join(sess_cls).where(sess_cls.user_id == user_id))
        msg_counts[msg_cls.__name__] = res.scalar() or 0

    total_messages = sum(msg_counts.values())

    # 3. Calculate Login Streak
    # Collect all session creation dates across all modules
    dates = set()
    for sess_cls in [ChatSession, CampusSession, ToolsSession, AgentsSession, VoiceSession]:
        res = await db.execute(select(sess_cls.created_at).where(sess_cls.user_id == user_id))
        for row in res.scalars():
            if row:
                dates.add(row.date())
    
    sorted_dates = sorted(list(dates), reverse=True)
    streak = 0
    if sorted_dates:
        today = datetime.now(timezone.utc).date()
        yesterday = today - timedelta(days=1)
        
        # Streak starts if the most recent activity was today or yesterday
        if sorted_dates[0] == today or sorted_dates[0] == yesterday:
            streak = 1
            current_date = sorted_dates[0]
            for i in range(1, len(sorted_dates)):
                if sorted_dates[i] == current_date - timedelta(days=1):
                    streak += 1
                    current_date = sorted_dates[i]
                else:
                    break
    
    return {
        "total_sessions": total_sessions,
        "total_messages": total_messages,
        "login_streak": streak,
        "modules": {
            "chat": {"sessions": counts["ChatSession"], "messages": msg_counts["ChatMessage"]},
            "campus": {"sessions": counts["CampusSession"], "messages": msg_counts["CampusMessage"]},
            "tools": {"sessions": counts["ToolsSession"], "messages": msg_counts["ToolsMessage"]},
            "agents": {"sessions": counts["AgentsSession"], "messages": msg_counts["AgentsMessage"]},
            "voice": {"sessions": counts["VoiceSession"], "messages": msg_counts["VoiceMessage"]},
        }
    }


async def create_forgot_password_token(email: str, db: AsyncSession) -> str | None:
    """Generate a 15-min secure token, save to DB, and return it."""
    import secrets
    from datetime import datetime, timezone, timedelta
    from app.models.password_reset import PasswordReset
    
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        return None
        
    token = secrets.token_urlsafe(32)
    # 15 minutes from now
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    reset_entry = PasswordReset(
        user_id=user.id,
        reset_token=token,
        expires_at=expires_at
    )
    db.add(reset_entry)
    await db.flush()
    logger.info("Created forgot password token for user id=%d", user.id)
    return token


async def reset_password_with_token(token: str, new_password: str, db: AsyncSession) -> bool:
    """Validate token from DB, update password, and delete token."""
    from datetime import datetime, timezone
    from app.core.security import hash_password
    from app.models.password_reset import PasswordReset
    from app.utils.exceptions import ForbiddenError
    
    # Find token
    result = await db.execute(
        select(PasswordReset).where(PasswordReset.reset_token == token)
    )
    reset_entry = result.scalar_one_or_none()
    
    if not reset_entry:
        raise ForbiddenError("Invalid or expired reset token")
        
    # Check expiry
    if reset_entry.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        await db.delete(reset_entry)
        await db.flush()
        raise ForbiddenError("Reset token has expired")
        
    # Find user
    result = await db.execute(select(User).where(User.id == reset_entry.user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise ForbiddenError("User not found")
        
    # Update password
    user.password_hash = hash_password(new_password)
    db.add(user)
    
    # Delete token (invalidate)
    await db.delete(reset_entry)
    
    await db.flush()
    logger.info("Successfully reset password for user id=%d with token", user.id)
    return True


async def clear_user_history(user_id: int, db: AsyncSession) -> bool:
    """Wipe all sessions and messages for a user across all modules."""
    from sqlalchemy import delete
    
    # Delete sessions (cascades will handle messages in most models, but we'll be explicit where needed)
    await db.execute(delete(ChatSession).where(ChatSession.user_id == user_id))
    await db.execute(delete(CampusSession).where(CampusSession.user_id == user_id))
    await db.execute(delete(ToolsSession).where(ToolsSession.user_id == user_id))
    await db.execute(delete(AgentsSession).where(AgentsSession.user_id == user_id))
    await db.execute(delete(VoiceSession).where(VoiceSession.user_id == user_id))
    
    await db.flush()
    logger.info("Wiped all history for user id=%d", user_id)
    return True
