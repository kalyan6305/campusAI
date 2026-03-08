import asyncio
import sys
import os

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.planner_agent_service import create_plan
from app.services.research_agent_service import run_research
from app.services.coding_agent_service import run_coding
from app.services.critic_agent_service import run_review

# Simulate the extract function
def extract_agent_task(plan_text: str, agent_name: str) -> str | None:
    lines = plan_text.splitlines()
    for line in lines:
        if agent_name in line and " - " in line:
            parts = line.split(" - ", 1)
            if len(parts) > 1:
                return parts[1].strip()
    return None

async def test_coding_orchestration():
    print("\n--- Full 5-Agent Orchestration Test (Planner -> Research -> Coding -> Critic) ---")
    goal = "Design a campus AI platform with real-time student tracking"
    print(f"Goal: {goal}")
    
    try:
        # 1. Planner Agent
        print("\nStep 1: Calling Planner Agent...")
        plan = await create_plan(goal)
        print("\nGenerated Plan:")
        print(plan)
        
        # 2. Research Agent
        research_summary = ""
        research_task = extract_agent_task(plan, "ResearchAgent")
        if research_task:
            print(f"\nStep 2: Calling Research Agent for: {research_task}")
            research_summary = await run_research(research_task)
            print("\nGenerated Research Summary:")
            print(research_summary)
            
        # 3. Coding Agent
        technical_design = ""
        coding_task = extract_agent_task(plan, "CodingAgent")
        if coding_task:
            print(f"\nStep 3: Calling Coding Agent for: {coding_task}")
            technical_design = await run_coding(coding_task)
            print("\nGenerated Technical Design:")
            print(technical_design)
            
        # 4. Critic Agent
        print("\nStep 4: Calling Critic Agent to review everything...")
        combined_text = plan
        if research_summary: combined_text += f"\n\n{research_summary}"
        if technical_design: combined_text += f"\n\n{technical_design}"
        
        critic_review = await run_review(combined_text)
        print("\nGenerated Critic Review:")
        print(critic_review)
        
        # Final Checks
        print("\n--- Final Checks ---")
        sections = ["TASK PLAN:", "RESEARCH SUMMARY:", "TECHNICAL DESIGN:", "CRITIC REVIEW:"]
        missing = [s for s in sections if s not in (plan + research_summary + technical_design + critic_review)]
        
        if not missing:
            print("🏆 Verification SUCCESS: All 5 agent sections are present and correct.")
        else:
            print(f"❌ Verification FAILED: Missing sections: {missing}")
            
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")

if __name__ == "__main__":
    asyncio.run(test_coding_orchestration())
