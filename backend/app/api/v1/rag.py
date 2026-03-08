"""
API endpoints for RAG document transparency.
"""

from fastapi import APIRouter, Depends
from typing import List
from pydantic import BaseModel

from app.services import rag_document_service
from app.utils.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/rag", tags=["RAG Transparency"])

class DocumentSchema(BaseModel):
    filename: str

class ChunkSchema(BaseModel):
    document: str
    chunk: str

class SearchRequest(BaseModel):
    query: str

@router.get("/documents", response_model=List[DocumentSchema])
async def get_rag_documents(
    current_user: User = Depends(get_current_user)
):
    """
    List all documents in the RAG knowledge base.
    """
    return await rag_document_service.list_available_documents()

@router.post("/search", response_model=List[ChunkSchema])
async def search_rag_chunks(
    request: SearchRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Search for relevant chunks across documents.
    """
    return await rag_document_service.search_chunks(request.query)
