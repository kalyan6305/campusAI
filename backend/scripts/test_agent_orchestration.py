import asyncio
import sys
import os

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.planner_agent_service import create_plan
from app.services.research_agent_service import run_research

# Simulate the extract function since it's internal to chat_service
def extract_agent_task(plan_text: str, agent_name: str) -> str | None:
    lines = plan_text.splitlines()
    for line in lines:
        if agent_name in line and " - " in line:
            parts = line.split(" - ", 1)
            if len(parts) > 1:
                return parts[1].strip()
    return None

async def test_agent_orchestration():
    print("\n--- Agent Orchestration Test (Planner -> Research) ---")
    goal = "Design a campus AI platform"
    print(f"Goal: {goal}")
    
    try:
        # 1. Planner Agent
        print("\nStep 1: Calling Planner Agent...")
        plan = await create_plan(goal)
        print("\nGenerated Plan:")
        print(plan)
        
        # 2. Extract Task
        print(f"\nStep 2: Extracting ResearchAgent task...")
        research_task = extract_agent_task(plan, "ResearchAgent")
        if not research_task:
            print("❌ ResearchAgent task not found in plan logic!")
            return
            
        print(f"Found Task: {research_task}")
        
        # 3. Research Agent
        print("\nStep 3: Calling Research Agent...")
        summary = await run_research(research_task)
        print("\nGenerated Research Summary:")
        print(summary)
        
        # Check requirements
        if "RESEARCH SUMMARY:" in summary:
            print("\n✅ Verification SUCCESS: Research summary generated correctly.")
        else:
            print("\n❌ Verification FAILED: 'RESEARCH SUMMARY:' header missing.")
            
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")

if __name__ == "__main__":
    asyncio.run(test_agent_orchestration())
