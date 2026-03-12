from __future__ import annotations
import json
import logging
from typing import Optional

from fastapi import APIRouter, Depends, Body  # type: ignore
from fastapi.responses import StreamingResponse  # type: ignore

from app.services.research_service import research_service  # type: ignore
from app.utils.dependencies import get_current_user  # type: ignore
from app.models.user import User  # type: ignore
from app.models.message import Message  # type: ignore
from app.services.chat_service import _get_session_with_messages  # type: ignore
from sqlalchemy.ext.asyncio import AsyncSession  # type: ignore
from app.db.base import get_db  # type: ignore

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/research", tags=["Research"])

@router.post("/stream")
async def stream_research(
    query: str = Body(..., embed=True),
    mode: str = Body("fast", embed=True),
    session_id: Optional[int] = Body(None, embed=True),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Stream research progress via SSE.
    """
    session_obj = None
    if session_id:
        try:
            session_obj = await _get_session_with_messages(session_id, current_user.id, db)
            user_msg = Message(session_id=session_id, role="user", content=query)
            db.add(user_msg)
            await db.flush()
            session_obj.messages.append(user_msg)
        except Exception as e:
            logger.error(f"Failed to fetch or update session: {e}")
            session_id = None  # fallback to not saving if session is invalid

    async def event_generator():
        final_answer = ""
        all_sources = []
        try:
            async for update in research_service.conduct_research(query, mode):
                if update.get("type") == "answer":
                    final_answer = update.get("content", "")
                if update.get("type") == "sources":
                    all_sources.extend(update.get("data", []))
                yield f"data: {json.dumps(update)}\n\n"
                
            if session_id and session_obj:
                # Save assistant answer
                if final_answer:
                    assistant_msg = Message(session_id=session_id, role="assistant", content=final_answer)
                    db.add(assistant_msg)
                
                # Save sources as a system message for later restoration
                if all_sources:
                    sources_json = json.dumps(all_sources, default=str)
                    sources_msg = Message(session_id=session_id, role="system", content=f"__SOURCES__:{sources_json}")
                    db.add(sources_msg)
                
                if len(session_obj.messages) <= 1:
                    session_obj.title = query[:80]  # type: ignore
                
                await db.commit()
                
            yield "data: [DONE]\n\n"
        except Exception as e:
            logger.error(f"Research streaming error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
