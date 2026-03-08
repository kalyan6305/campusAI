"""
Session request/response schemas.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class SessionCreate(BaseModel):
    title: str = Field(default="New Chat", max_length=255)


class SessionUpdate(BaseModel):
    title: str = Field(..., max_length=255)


class SessionResponse(BaseModel):
    id: int
    title: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SessionListResponse(BaseModel):
    sessions: list[SessionResponse]
