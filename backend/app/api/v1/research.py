"""
Web Research API endpoints — streaming JSON objects for ReAct loop state.
"""

import json
import logging
from typing import Optional

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.models.user import User
from app.services.research_service import ResearchService
from app.utils.dependencies import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/research", tags=["Research"])

class ResearchRequest(BaseModel):
    query: str
    mode: str = "fast" # "fast" or "deep"
    session_id: Optional[int] = None

@router.post("/stream")
async def stream_research(
    body: ResearchRequest,
    current_user: User = Depends(get_current_user),
):
    """Start a Web Research session, streaming Thoughts, Actions, Sources, and Answers as JSON."""
    service = ResearchService()
    
    async def event_generator():
        try:
            async for chunk in service.stream_research(query=body.query, mode=body.mode):
                # We yield each JSON string as a Server-Sent Event data block
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as exc:
            logger.error("Research stream error: %s", exc)
            error_data = json.dumps({"type": "error", "content": str(exc)})
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
