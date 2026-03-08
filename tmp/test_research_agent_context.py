
import asyncio
import os
import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).resolve().parents[1] / "backend"))

from app.agents.research_agent import ResearchAgent

async def test_agent_with_context():
    print("Testing ResearchAgent WITH CONTEXT Execution...")
    agent = ResearchAgent()
    query = "what is interference of light"
    context = """
    R23 regulation for Interference: emphasize on laser and coherence length.
    R20 regulation for Interference: focus on Newton's rings and thin films.
    """
    
    print(f"\nQUERY: {query}")
    try:
        response = await agent.research(query, context=context)
        print("\n--- AGENT RESPONSE ---")
        print(response)
        print("----------------------")
        with open("tmp/agent_response_context.txt", "w", encoding="utf-8") as f:
            f.write(response)
        print("\nSaved response to tmp/agent_response_context.txt")
    except Exception as e:
        import traceback
        print(f"Research failed: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_agent_with_context())
