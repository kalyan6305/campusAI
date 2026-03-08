"""
Chat API endpoints — send messages, stream responses.
"""

from __future__ import annotations

import json
import logging

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse, MessageSchema
from app.services import chat_service
from app.utils.dependencies import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("", response_model=ChatResponse)
async def send_message(
    body: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a message and get a full (non-streaming) response."""
    assistant_msg = await chat_service.process_chat(
        session_id=body.session_id,
        user_message=body.message,
        user_id=current_user.id,
        db=db,
    )
    return ChatResponse(
        session_id=body.session_id,
        mode="CHAT_MODE", # Default for non-streaming for now, or use analyze_request if needed
        message=MessageSchema(role="assistant", content=assistant_msg.content),
        timestamp=assistant_msg.timestamp,
    )


@router.post("/stream")
async def stream_message(
    body: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a message and stream the response via Server-Sent Events."""

    async def event_generator():
        try:
            async for result in chat_service.process_chat_stream(
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
            logger.error("Stream error: %s", exc)
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
