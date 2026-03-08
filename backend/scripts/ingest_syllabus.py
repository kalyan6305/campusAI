"""
Script to ingest the provided syllabus document into the RAG vector store.
"""

import sys
import os
import asyncio
from pathlib import Path

# Add backend directory to path so we can import app modules
backend_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(backend_dir))

from app.rag.rag_service import build_knowledge_base
import shutil

async def main():
    # Find the syllabus PDF from the user's project root
    project_root = backend_dir.parent
    syllabus_path = project_root / "CSE - AI&DS_IV Years_CS & Syllabus_UG_R20.pdf"
    
    if not syllabus_path.exists():
        print(f"Error: Could not find syllabus PDF at {syllabus_path}")
        return

    # To use the existing build_knowledge_base, it expects a folder of PDFs.
    # We will create a temporary folder in data/, copy the PDF there, ingest, then clean up.
    data_dir = backend_dir / "data"
    temp_docs_dir = data_dir / "temp_syllabus_docs"
    temp_docs_dir.mkdir(parents=True, exist_ok=True)
    
    dest_path = temp_docs_dir / syllabus_path.name
    shutil.copy2(syllabus_path, dest_path)
    
    print(f"Ingesting {syllabus_path.name} into RAG index...")
    
    # RAGService.build_knowledge_base creates the index inside data/rag
    success = await build_knowledge_base(str(temp_docs_dir))
    
    # Clean up temp docs
    shutil.rmtree(temp_docs_dir)
    
    if success:
        print("Syllabus successfully ingested.")
    else:
        print("Failed to ingest syllabus.")

if __name__ == "__main__":
    asyncio.run(main())
