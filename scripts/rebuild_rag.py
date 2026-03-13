import asyncio
import os
import sys

# Add backend/ to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.rag.rag_service import RAGService

async def main():
    service = RAGService()
    docs_folder = os.path.join(os.getcwd(), 'backend', 'data', 'documents')
    print(f"Rebuilding knowledge base from {docs_folder}...")
    success = await service.build_knowledge_base(docs_folder)
    if success:
        print("Knowledge base rebuilt successfully!")
    else:
        print("Failed to rebuild knowledge base.")

if __name__ == "__main__":
    asyncio.run(main())
