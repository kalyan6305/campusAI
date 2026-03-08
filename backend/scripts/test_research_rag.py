import asyncio
import os
import sys
import json

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.rag.rag_service import RAGService
from app.agents.research_agent import ResearchAgent

async def test_research_rag():
    print("\n--- Phase 3: RAG-Enhanced ResearchAgent Verification ---")
    
    # Setup test directories
    rag_data_dir = "data/rag_test"
    os.makedirs(rag_data_dir, exist_ok=True)
    
    # 1. Pre-populate Knowledge Base with specific hostel info
    service = RAGService(data_dir=rag_data_dir)
    test_chunks = [
        "The monthly hostel fee for Campus AI University is Rs. 3000.",
        "Hostel admission requires a security deposit of Rs. 5000.",
        "Hostel curfew is strictly 10:00 PM for all residents.",
        "Students must apply for hostel leave 24 hours in advance."
    ]
    
    print("Step 1: Populating Knowledge Base...")
    embeddings = service.embedder.create_embeddings(test_chunks)
    service.vector_store.create_index(embeddings)
    service.vector_store.save_index()
    with open(os.path.join(rag_data_dir, "chunks.json"), "w", encoding="utf-8") as f:
        json.dump(test_chunks, f)
    
    # 2. Initialize ResearchAgent (it will use the default data/rag path unless we modify it or mock it)
    # Since ResearchAgent uses the default RAGService() which points to "data/rag", 
    # let's quickly copy the test index to the default location for the test.
    
    default_rag_dir = "data/rag"
    os.makedirs(default_rag_dir, exist_ok=True)
    import shutil
    shutil.copy(os.path.join(rag_data_dir, "vector_store.index"), os.path.join(default_rag_dir, "vector_store.index"))
    shutil.copy(os.path.join(rag_data_dir, "chunks.json"), os.path.join(default_rag_dir, "chunks.json"))
    
    agent = ResearchAgent()
    
    # 3. Execution
    task = "What is the hostel fee and curfew?"
    print(f"\nStep 2: Executing Research Task: '{task}'")
    
    summary = await agent.research(task)
    
    print("\nResearch Output:")
    print("-" * 30)
    print(summary)
    print("-" * 30)
    
    # 4. Verification
    success_fee = "3000" in summary
    success_curfew = "10:00" in summary
    
    if success_fee and success_curfew:
        print("\n🏆 Verification SUCCESS: ResearchAgent successfully used RAG context for specific details.")
    else:
        print("\n❌ Verification FAILED: ResearchAgent missed document-specific details.")

if __name__ == "__main__":
    asyncio.run(test_research_rag())
