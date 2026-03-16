"""
Research Agent Router — Endpoints for the enhanced Research Agent (multi-mode).
POST /research/analyze — accepts mode, query, and optional document file.
"""

from __future__ import annotations

import io
import json
import logging
from fastapi import APIRouter, Depends, Form, File, UploadFile
from fastapi.responses import StreamingResponse
from typing import Optional

from app.utils.dependencies import get_current_user
from app.models.user import User
from app.agents.research_agent import ResearchAgent

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/research", tags=["Research Agent"])


def _extract_text_from_pdf(content: bytes) -> str:
    """Extract text from PDF bytes using PyPDF2."""
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(io.BytesIO(content))
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text.strip()
    except Exception as e:
        logger.error(f"PDF text extraction failed: {e}")
        return ""


def _extract_text_from_docx(content: bytes) -> str:
    """Extract text from DOCX bytes using python-docx."""
    try:
        import docx
        doc = docx.Document(io.BytesIO(content))
        return "\n".join([para.text for para in doc.paragraphs if para.text.strip()])
    except Exception as e:
        logger.error(f"DOCX text extraction failed: {e}")
        return ""


@router.post("/analyze")
async def analyze_research(
    mode: str = Form(...),
    query: str = Form(""),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user)
):
    """
    Streaming SSE endpoint for all Research Agent modes.
    - mode='topic'              → structured topic explanation
    - mode='paper_analysis'     → paper breakdown (requires file or query with paper description)
    - mode='project_ideas'      → project idea generation
    - mode='writing_assistance' → academic writing content
    """

    # Extract document text if a file is uploaded
    document_text = ""
    if file and file.filename:
        file_content = await file.read()
        filename_lower = file.filename.lower()

        if filename_lower.endswith(".pdf"):
            document_text = _extract_text_from_pdf(file_content)
        elif filename_lower.endswith(".docx"):
            document_text = _extract_text_from_docx(file_content)
        elif filename_lower.endswith(".txt"):
            document_text = file_content.decode("utf-8", errors="ignore")

        if not document_text:
            async def error_stream():
                yield f"data: {json.dumps({'status': 'ERROR', 'message': 'Could not extract text from the uploaded document. Try a different file or paste the content directly.'})}\n\n"
            return StreamingResponse(error_stream(), media_type="text/event-stream")

    # Validate inputs
    if not query.strip() and not document_text:
        async def empty_error():
            yield f"data: {json.dumps({'status': 'ERROR', 'message': 'Please provide a query or upload a document.'})}\n\n"
        return StreamingResponse(empty_error(), media_type="text/event-stream")

    async def event_generator():
        try:
            yield f"data: {json.dumps({'status': 'START'})}\n\n"

            agent = ResearchAgent()
            full_reply = []

            async for token in agent.stream_mode(mode=mode, query=query, document_text=document_text):
                full_reply.append(token)
                yield f"data: {json.dumps({'status': 'STREAMING', 'token': token})}\n\n"

            yield f"data: {json.dumps({'status': 'DONE', 'full_text': ''.join(full_reply)})}\n\n"
            yield "data: [DONE]\n\n"

        except Exception as e:
            logger.error(f"Research analyze endpoint failed: {e}")
            yield f"data: {json.dumps({'status': 'ERROR', 'message': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
