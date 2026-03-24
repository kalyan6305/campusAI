"""
Auth API endpoints — register, login, current user, stats, and password resets.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
    UserUpdate,
    PasswordResetRequest,
    PasswordResetConfirm,
)
from app.services import auth_service, email_service
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Create a new user account."""
    user = await auth_service.register_user(body.email, body.password, db)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate and return an access token."""
    token = await auth_service.authenticate_user(body.email, body.password, db)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user."""
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_me(
    body: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update settings for the currently authenticated user."""
    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_user, key, value)
    
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.get("/stats")
async def get_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Return usage statistics for the current user."""
    stats = await auth_service.get_user_stats(current_user.id, db)
    return stats


@router.post("/forgot-password")
async def forgot_password(
    body: PasswordResetRequest,
    db: AsyncSession = Depends(get_db)
):
    """Generate a token and send a reset email."""
    token = await auth_service.create_forgot_password_token(body.email, db)
    if token:
        await email_service.send_password_reset_email(body.email, token)
        
    # Generic message to prevent user enumeration
    return {"message": "If this email is registered, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password_endpoint(
    body: PasswordResetConfirm,
    db: AsyncSession = Depends(get_db)
):
    """Validate token from DB and update password."""
    await auth_service.reset_password_with_token(body.token, body.new_password, db)
    return {"message": "Password updated successfully."}


@router.delete("/history")
async def delete_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Wipe all user session and message history."""
    await auth_service.clear_user_history(current_user.id, db)
    return {"message": "All history has been purged from official records."}
