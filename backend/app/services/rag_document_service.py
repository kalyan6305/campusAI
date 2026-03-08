"""
Service layer for RAG document operations.
"""

import logging
from app.rag import rag_service

logger = logging.getLogger(__name__)

async def list_available_documents():
    """
    Retrieve all document metadata from the RAG knowledge base.
    """
    try:
        documents = await rag_service.get_all_documents()
        return documents
    except Exception as e:
        logger.error(f"Failed to list RAG documents: {e}")
        return []

async def search_chunks(query: str):
    """
    Search for relevant document chunks.
    """
    try:
        chunks = await rag_service.query_knowledge(query, k=5)
        # Transform to schema-compatible list of dicts if needed
        return [{"document": "Source", "chunk": c} for c in chunks]
    except Exception as e:
        logger.error(f"Failed to search RAG chunks: {e}")
        return []
