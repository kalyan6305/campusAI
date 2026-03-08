import asyncio
import sys
import os

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.agents.planner_agent import PlannerAgent

async def test_planner_agent():
    agent = PlannerAgent()
    
    goal = "Design a campus AI platform"
    
    print(f"\n--- Planner Agent Test ---")
    print(f"Goal: {goal}")
    
    try:
        plan = await agent.create_plan(goal)
        print("\nGenerated Plan:")
        print("-" * 20)
        print(plan)
        print("-" * 20)
        
        # Check for expected format/content
        if "TASK PLAN:" in plan:
            print("\nFormat check: 'TASK PLAN:' found. ✅")
        else:
            print("\nFormat check: 'TASK PLAN:' NOT found. ❌")
            
        expected_agents = ["ResearchAgent", "CodingAgent", "DataAgent", "CriticAgent"]
        missing_agents = [a for a in expected_agents if a not in plan]
        
        if not missing_agents:
            print("Agent check: All specified agents found in plan. ✅")
        else:
            print(f"Agent check: Missing agents: {missing_agents} ❌")
            
    except Exception as e:
        print(f"\nTest failed with error: {e}")

if __name__ == "__main__":
    asyncio.run(test_planner_agent())
