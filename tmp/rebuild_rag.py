
import asyncio
import os
import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).resolve().parents[1] / "backend"))

from app.rag.rag_service import build_knowledge_base

async def main():
    print("Rebuilding Knowledge Base...")
    # Use absolute path for documents
    docs_path = str(Path(__file__).resolve().parents[1] / "backend" / "data" / "documents")
    success = await build_knowledge_base(docs_path)
    if success:
        print("Knowledge base rebuilt successfully.")
    else:
        print("Failed to rebuild knowledge base.")

if __name__ == "__main__":
    asyncio.run(main())
