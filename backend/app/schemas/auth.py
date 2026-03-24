"""
Auth request/response schemas.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# ── Requests ──────────────────────────────────────────────


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class UserUpdate(BaseModel):
    nickname: str | None = None
    occupation: str | None = None
    about_me: str | None = None
    custom_instructions: str | None = None
    appearance: str | None = None
    accent_color: str | None = None
    language: str | None = None


# ── Responses ─────────────────────────────────────────────


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: str
    nickname: str | None = None
    occupation: str | None = None
    about_me: str | None = None
    custom_instructions: str | None = None
    appearance: str = "system"
    accent_color: str = "blue"
    language: str = "english"
    created_at: datetime

    model_config = {"from_attributes": True}
