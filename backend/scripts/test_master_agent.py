import asyncio
import sys
import os

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.agents.master_agent import MasterAgent

async def test_master_agent():
    agent = MasterAgent()
    
    test_cases = [
        ("Hi", "CHAT_MODE"),
        ("What is the weather today?", "CHAT_MODE"),
        ("Plan a new architecture for a campus management system", "AGENT_MODE"),
        ("build a system for student registration", "AGENT_MODE"),
        ("I need a research analysis on AI trends in 2024 for my project strategy", "AGENT_MODE"),
        ("This is a very long request that should trigger agent mode based on the length of the string even if it does not contain any of the keywords we specified like architecture or build or plan or design or project or research or analysis or strategy because it exceeds forty words in total length.", "AGENT_MODE")
    ]
    
    print("\n--- Master Agent Test Results ---")
    for goal, expected_mode in test_cases:
        result = await agent.analyze_goal(goal)
        print(f"\nGoal: {goal[:50]}...")
        print(f"Result: {result}")
        assert result["mode"] == expected_mode, f"Expected {expected_mode}, got {result['mode']}"
    
    print("\nAll tests passed!")

if __name__ == "__main__":
    asyncio.run(test_master_agent())
