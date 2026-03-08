
import asyncio
import os
import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).resolve().parents[1] / "backend"))

from app.rag.rag_service import query_knowledge_by_regulation

async def test_retrieval():
    print("Testing RAG Retrieval...")
    query = "Newton Law"
    results = await query_knowledge_by_regulation(query)
    print("\n--- RETRIEVAL RESULTS ---")
    import json
    print(json.dumps(results, indent=2))
    print("-------------------------")

if __name__ == "__main__":
    asyncio.run(test_retrieval())
