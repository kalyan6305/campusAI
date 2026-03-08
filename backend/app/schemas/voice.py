"""
Voice session/message request/response schemas.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class VoiceSessionCreate(BaseModel):
    title: str = Field(default="Voice Chat", max_length=255)


class VoiceSessionResponse(BaseModel):
    id: int
    title: str
    created_at: datetime

    model_config = {"from_attributes": True}


class VoiceSessionListResponse(BaseModel):
    sessions: list[VoiceSessionResponse]


class VoiceMessageSchema(BaseModel):
    role: str = Field(pattern="^(user|assistant|system)$")
    content: str = Field(min_length=1)


class VoiceChatRequest(BaseModel):
    session_id: int
    message: str = Field(min_length=1, max_length=16_000)
    metadata: dict = None
