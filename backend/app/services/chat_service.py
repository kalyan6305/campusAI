"""
Chat service — orchestrates message persistence and LLM calls.
"""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator
from datetime import datetime, timezone

import pandas as pd
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.llm.factory import get_llm_provider
from app.models import (
    ChatSession, ChatMessage,
    CampusSession, CampusMessage,
    ToolsSession, ToolsMessage,
    AgentsSession, AgentsMessage
)
from app.utils.exceptions import LLMError, NotFoundError
from app.services import rag_document_service
from app.rag import rag_service
from app.agents.research_agent import ResearchAgent
from app.agents.career_agent import CareerAgent
from app.agents.academic_agent import AcademicAgent
from app.services.web_search_service import web_search_service
from app.services.student_service import get_student_by_roll

logger = logging.getLogger(__name__)

MODEL_MAP = {
    "chat": (ChatSession, ChatMessage),
    "campus": (CampusSession, CampusMessage),
    "tools": (ToolsSession, ToolsMessage),
    "agents": (AgentsSession, AgentsMessage),
}

def _get_models(module: str = "chat"):
    """Helper to return (SessionModel, MessageModel) for a given module."""
    if module in MODEL_MAP:
        return MODEL_MAP[module]
        
    # Fallback for dynamic agent modes to 'agents' table
    if module in ["career", "academic", "research", "coding", "analysis", "current_affairs"]:
        return MODEL_MAP["agents"]
    
    # Fallback for campus sub-modules to 'campus' table
    if module in ["academics", "bus services", "hostel", "fees", "attendance", "sports", "transport", "results", "student info"]:
        return MODEL_MAP["campus"]

    logger.warning("Unknown module '%s' requested, falling back to 'chat' table", module)
    return MODEL_MAP["chat"]


async def _get_session_with_messages(
    session_id: int,
    user_id: int,
    db: AsyncSession,
    module: str = "chat"
) -> ChatSession:
    """Fetch session with messages from the appropriate table, verify ownership."""
    SessionModel, _ = _get_models(module)
    result = await db.execute(
        select(SessionModel)
        .options(selectinload(SessionModel.messages))
        .where(SessionModel.id == session_id, SessionModel.user_id == user_id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise NotFoundError(f"{module.capitalize()} session not found")
    return session


def _build_llm_messages(session: ChatSession) -> list[dict]:
    """Convert ORM messages to the list[dict] format LLM providers expect."""
    return [
        {"role": msg.role, "content": msg.content}
        for msg in session.messages
    ]


async def process_chat(
    session_id: int,
    user_message: str,
    user_id: int,
    db: AsyncSession,
    metadata: dict = None
) -> ChatMessage:
    """
    1. Save user message to correct table
    2. Call LLM
    3. Save assistant message to correct table
    """
    module = metadata.get("module", "chat") if metadata else "chat"
    mode = metadata.get("mode", "CHAT_MODE") if metadata else "CHAT_MODE"
    
    # Resolve module if it's an agent mode
    if mode in ["career", "academic", "research", "coding", "analysis", "current_affairs"]:
        module = "agents"
    
    # Map academics module to academic agent mode
    if module == "academics":
        mode = "academic"

    SessionModel, MessageModel = _get_models(module)
    session = await _get_session_with_messages(session_id, user_id, db, module=module)

    # Persist user message
    user_msg = MessageModel(
        session_id=session_id,
        role="user",
        content=user_message,
    )
    db.add(user_msg)
    await db.flush()
    session.messages.append(user_msg)

    # Call LLM
    llm = get_llm_provider()
    messages = _build_llm_messages(session)

    # RAG framework check (already present)
    rag_context = await rag_service.query_knowledge_by_regulation(user_message)
    context_str = ""
    if rag_context:
        for reg, chunks in rag_context.items():
            context_str += f"\n--- {reg} Regulation ---\n" + "\n".join(chunks)

    # Route agent based on arbitrary mode determination
    try:
        if module == "student info":
            # Deterministic Excel lookup
            student_data = get_student_by_roll(user_message)
            if student_data:
                reply_text = "🎓 **Student Details**\n\n"
                # Vertical list formatting
                for key, value in student_data.items():
                    if pd.notna(value) and str(value).strip() != '':
                        display_key = key.replace('_', ' ').title()
                        reply_text += f"**{display_key}**: {value}\n\n"
            else:
                reply_text = "Student not found in the dataset."
        else:
            research_agent = ResearchAgent()
            reply_text = await research_agent.research(user_message, context_str)
    except Exception as exc:
        logger.error("Agent generate failed: %s", exc)
        raise LLMError(f"Agent error: {exc}") from exc

    # Persist assistant message
    assistant_msg = MessageModel(
        session_id=session_id,
        role="assistant",
        content=reply_text,
    )
    db.add(assistant_msg)
    await db.flush()
    await db.refresh(assistant_msg)

    # Auto-title the session from first exchange
    if len(session.messages) <= 2: # User + Assistant
        session.title = user_message[:80]
        await db.flush()
    
    await db.commit()

    logger.info("Chat processed: session=%d tokens_out=%d", session_id, len(reply_text))
    return assistant_msg


async def process_chat_stream(
    session_id: int,
    user_message: str,
    user_id: int,
    db: AsyncSession,
    metadata: dict = None
) -> AsyncIterator[dict]:
    """
    Streaming variant with dynamic table persistence.
    """
    module = metadata.get("module", "chat") if metadata else "chat"
    mode = metadata.get("mode", "CHAT_MODE") if metadata else "CHAT_MODE"
    
    # If mode is an agent, use 'agents' module table
    if mode in ["career", "academic", "research", "coding", "analysis", "current_affairs"]:
        module = "agents"

    # Map academics module to academic agent mode
    if module == "academics":
        mode = "academic"

    SessionModel, MessageModel = _get_models(module)
    session = await _get_session_with_messages(session_id, user_id, db, module=module)

    user_msg = MessageModel(
        session_id=session_id,
        role="user",
        content=user_message,
    )
    db.add(user_msg)
    await db.flush()
    session.messages.append(user_msg)
    
    yield {"mode": mode, "status": "START", "token": ""}

    # --- Web Search for Tools Mode ---
    web_context = ""
    search_results = []
    if mode == "tools":
        # Let's signify search is happening
        yield {"mode": mode, "status": "SEARCHING", "token": ""}
        search_data = await web_search_service.search(user_message)
        search_results = search_data["results"]
        platform_links = search_data["platform_links"]
        
        # Format web context for Agent
        web_context = "--- Web Search Results ---\n"
        for res in search_results:
            web_context += f"Source: {res['source']}\nTitle: {res['title']}\nSnippet: {res['snippet']}\n\n"
            
        # Yield metadata to frontend for sidebar population
        yield {"mode": mode, "status": "METADATA", "metadata": {"sources": search_results, "platform_links": platform_links}}

    # --- RAG Injection ---
    rag_context = await rag_service.query_knowledge_by_regulation(user_message)
    context_str = ""
    if rag_context:
        for reg, chunks in rag_context.items():
            context_str += f"\n--- {reg} Regulation ---\n" + "\n".join(chunks)

    full_reply: list[str] = []

    try:
        if module == "student info":
            # Deterministic Excel lookup
            student_data = get_student_by_roll(user_message)
            if student_data:
                reply = "🎓 **Student Details**\n\n"
                for key, value in student_data.items():
                    if pd.notna(value) and str(value).strip() != '':
                        display_key = key.replace('_', ' ').title()
                        reply += f"**{display_key}**: {value}\n\n"
            else:
                reply = "Student not found in the dataset."
                
            for token in reply:
                full_reply.append(token)
                yield {"mode": mode, "token": token}
                
        elif mode == "career":
            career_agent = CareerAgent()
            async for token in career_agent.stream_response(user_id, user_message, db):
                full_reply.append(token)
                yield {"mode": mode, "token": token}
        elif mode == "academic":
            academic_agent = AcademicAgent()
            async for token in academic_agent.stream_response(user_message, context_str):
                full_reply.append(token)
                yield {"mode": mode, "token": token}
        else:
            # Default fallback to ResearchAgent
            research_agent = ResearchAgent()
            async for token in research_agent.stream_research(user_message, context_str, web_context):
                full_reply.append(token)
                yield {"mode": mode, "token": token}
    except Exception as exc:
        logger.error("Agent stream failed: %s", exc)
        raise LLMError(f"Agent stream error: {exc}") from exc

    # Persist complete assistant reply
    reply_text = "".join(full_reply)
    assistant_msg = MessageModel(
        session_id=session_id,
        role="assistant",
        content=reply_text,
    )
    db.add(assistant_msg)

    if len(session.messages) <= 2:
        session.title = user_message[:80]

    await db.commit()
    logger.info("Stream completed: session=%d chars=%d", session_id, len(reply_text))
