"""
Session API endpoints — CRUD for chat sessions.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import get_db
from app.models.user import User
from app.schemas.chat import MessageSchema
from app.schemas.session import (
    SessionCreate,
    SessionListResponse,
    SessionResponse,
    SessionUpdate,
)
from app.services import session_service
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/sessions", tags=["Sessions"])


@router.post("", response_model=SessionResponse, status_code=201)
async def create_session(
    body: SessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new chat session."""
    session = await session_service.create_session(
        user_id=current_user.id, title=body.title, module=body.module, db=db
    )
    return session


@router.get("", response_model=SessionListResponse)
async def list_sessions(
    module: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all sessions for the current user. Optional module filter."""
    sessions = await session_service.list_sessions(current_user.id, db, module=module)
    return SessionListResponse(sessions=sessions)


@router.get("/{session_id}/messages", response_model=list[MessageSchema])
async def get_messages(
    session_id: int,
    module: str = "chat",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all messages for a session from the specified module's table."""
    messages = await session_service.get_session_messages(
        session_id, current_user.id, db, module=module
    )
    return [
        MessageSchema(role=m.role, content=m.content)
        for m in messages
    ]


@router.delete("/{session_id}", status_code=204)
async def delete_session(
    session_id: int,
    module: str = "chat",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a session from the specified module's table."""
    await session_service.delete_session(session_id, current_user.id, db, module=module)


@router.patch("/{session_id}", response_model=SessionResponse)
async def rename_session(
    session_id: int,
    body: SessionUpdate,
    module: str = "chat",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Rename an existing session in the specified module's table."""
    session = await session_service.update_session(
        session_id=session_id, user_id=current_user.id, title=body.title, db=db, module=module
    )
    return session


@router.delete("/{session_id}/truncate/{index}", status_code=204)
async def truncate_session(
    session_id: int,
    index: int,
    module: str = "chat",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Truncate a session's history from the specified module's table."""
    await session_service.truncate_session(
        session_id=session_id, user_id=current_user.id, message_index=index, db=db, module=module
    )

