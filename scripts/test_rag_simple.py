import asyncio
import os
import sys
from dotenv import load_dotenv

# Add backend/ to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))
load_dotenv(os.path.join(os.getcwd(), 'backend', '.env'))

from app.rag.rag_service import query_knowledge_by_regulation

async def test_rag():
    query = "What is the syllabus for CSE branch, specifically about Artificial Intelligence subject in R20 regulation?"
    print(f"Testing RAG Query: {query}")
    
    # Force the service to look in the correct directory
    os.chdir('backend')
    
    context = await query_knowledge_by_regulation(query)
    
    print("\nGrouped Results:")
    for reg, chunks in context.items():
        print(f"\n--- {reg} Regulation ---")
        for chunk in chunks:
            print(f"- {chunk[:100]}...")

if __name__ == "__main__":
    asyncio.run(test_rag())
