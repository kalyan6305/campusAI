import asyncio
import sys
import os

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.planner_agent_service import create_plan
from app.services.research_agent_service import run_research
from app.services.critic_agent_service import run_review

# Simulate the extract function since it's internal to chat_service
def extract_agent_task(plan_text: str, agent_name: str) -> str | None:
    lines = plan_text.splitlines()
    for line in lines:
        if agent_name in line and " - " in line:
            parts = line.split(" - ", 1)
            if len(parts) > 1:
                return parts[1].strip()
    return None

async def test_critic_orchestration():
    print("\n--- Full Agent Orchestration Test (Planner -> Research -> Critic) ---")
    goal = "Design a campus AI platform with real-time student tracking"
    print(f"Goal: {goal}")
    
    try:
        # 1. Planner Agent
        print("\nStep 1: Calling Planner Agent...")
        plan = await create_plan(goal)
        print("\nGenerated Plan:")
        print(plan)
        
        # 2. Extract Task for Research
        print(f"\nStep 2: Extracting ResearchAgent task...")
        research_task = extract_agent_task(plan, "ResearchAgent")
        research_summary = ""
        if research_task:
            print(f"Found Research Task: {research_task}")
            # 3. Research Agent
            print("\nStep 3: Calling Research Agent...")
            research_summary = await run_research(research_task)
            print("\nGenerated Research Summary:")
            print(research_summary)
        else:
            print("⚠️ ResearchAgent task not found in plan, skipping research.")
            
        # 4. Combine and Criticize
        print("\nStep 4: Calling Critic Agent to review the work...")
        combined_text = f"{plan}\n\n{research_summary}" if research_summary else plan
        critic_review = await run_review(combined_text)
        print("\nGenerated Critic Review:")
        print(critic_review)
        
        # Check requirements
        print("\n--- Final Checks ---")
        checks = {
            "TASK PLAN:": "TASK PLAN:" in plan,
            "RESEARCH SUMMARY:": "RESEARCH SUMMARY:" in research_summary if research_summary else True,
            "CRITIC REVIEW:": "CRITIC REVIEW:" in critic_review
        }
        
        all_passed = True
        for name, passed in checks.items():
            status = "✅" if passed else "❌"
            print(f"{status} {name}")
            if not passed:
                all_passed = False
        
        if all_passed:
            print("\n🏆 Verification SUCCESS: Full orchestration flow verified.")
        else:
            print("\n❌ Verification FAILED: One or more sections are missing.")
            
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")

if __name__ == "__main__":
    asyncio.run(test_critic_orchestration())
