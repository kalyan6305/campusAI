"""
V1 API router — aggregates all v1 sub-routers.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.chat import router as chat_router
from app.api.v1.sessions import router as sessions_router
from app.api.v1.rag import router as rag_router
from app.api.v1.voice import router as voice_router

v1_router = APIRouter(prefix="/api/v1")
v1_router.include_router(auth_router)
v1_router.include_router(chat_router)
v1_router.include_router(sessions_router)
v1_router.include_router(rag_router)
v1_router.include_router(voice_router)

