"""
Authentication service — handles registration and login.
"""

from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.utils.exceptions import ConflictError

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
        from app.utils.exceptions import AppException
        raise AppException(status_code=401, detail="Invalid email or password")

    token = create_access_token(data={"sub": str(user.id)})
    logger.info("Authenticated user id=%d", user.id)
    return token
