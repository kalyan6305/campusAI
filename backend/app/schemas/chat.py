"""
Chat request/response schemas.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class MessageSchema(BaseModel):
    role: str = Field(pattern="^(user|assistant|system)$")
    content: str = Field(min_length=1)


class ChatRequest(BaseModel):
    session_id: int
    message: str = Field(min_length=1, max_length=16_000)


class ChatResponse(BaseModel):
    session_id: int
    mode: str = "CHAT_MODE"
    message: MessageSchema
    timestamp: datetime
