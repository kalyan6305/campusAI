"""
Voice API endpoints — session management and streaming voice chat.
"""

from __future__ import annotations

import json
import logging

from fastapi import APIRouter, Depends  # type: ignore
from fastapi.responses import StreamingResponse  # type: ignore
from sqlalchemy.ext.asyncio import AsyncSession  # type: ignore

from app.db.base import get_db  # type: ignore
from app.models.user import User  # type: ignore
from app.schemas.voice import (  # type: ignore
    VoiceChatRequest,
    VoiceMessageSchema,
    VoiceSessionCreate,
    VoiceSessionListResponse,
    VoiceSessionResponse,
)
from app.services import voice_service  # type: ignore
from app.utils.dependencies import get_current_user  # type: ignore

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/voice", tags=["Voice"])


# ── Session CRUD ──────────────────────────────────────


@router.post("/sessions", response_model=VoiceSessionResponse, status_code=201)
async def create_voice_session(
    body: VoiceSessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new voice session."""
    session = await voice_service.create_voice_session(
        user_id=current_user.id, title=body.title, db=db
    )
    return session


@router.get("/sessions", response_model=VoiceSessionListResponse)
async def list_voice_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all voice sessions for the current user."""
    sessions = await voice_service.list_voice_sessions(current_user.id, db)
    return VoiceSessionListResponse(sessions=sessions)


@router.get("/sessions/{session_id}/messages", response_model=list[VoiceMessageSchema])
async def get_voice_messages(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all messages for a voice session."""
    messages = await voice_service.get_voice_session_messages(
        session_id, current_user.id, db
    )
    return [
        VoiceMessageSchema(role=m.role, content=m.content)
        for m in messages
    ]


@router.delete("/sessions/{session_id}", status_code=204)
async def delete_voice_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a voice session and all its messages."""
    await voice_service.delete_voice_session(session_id, current_user.id, db)


# ── Streaming Voice Chat ─────────────────────────────


@router.post("/chat/stream")
async def stream_voice_chat(
    body: VoiceChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a voice message and stream the response via SSE."""

    async def event_generator():
        try:
            async for result in voice_service.process_voice_chat_stream(
                session_id=body.session_id,
                user_message=body.message,
                user_id=current_user.id,
                db=db,
                metadata=body.metadata,
            ):
                data = json.dumps(result)
                yield f"data: {data}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as exc:
            logger.error("Voice stream error: %s", exc)
            error_data = json.dumps({"error": str(exc)})
            yield f"data: {error_data}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
