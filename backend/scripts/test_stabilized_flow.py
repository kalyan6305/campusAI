import asyncio
import os
import sys

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from app.services.planner_agent_service import create_plan
from app.services.research_agent_service import run_research
from app.services.coding_agent_service import run_coding
from app.services.data_agent_service import run_data_analysis
from app.services.critic_agent_service import run_review

def extract_agent_task(plan_text: str, agent_name: str) -> str | None:
    lines = plan_text.splitlines()
    for line in lines:
        if agent_name in line and " - " in line:
            parts = line.split(" - ", 1)
            if len(parts) > 1:
                return parts[1].strip()
    return None

async def test_stabilized_orchestration():
    print("\n--- Phase 3: Stabilized Orchestration Verification ---")
    
    goal = "Find the hostel fee details and suggest a student portal module to display it."
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
            
        # 3. Data Agent
        data_analysis = ""
        data_task = extract_agent_task(plan, "DataAgent")
        if data_task:
            print(f"\nStep 3: Calling Data Agent for: {data_task}")
            data_analysis = await run_data_analysis(data_task)
            print("\nGenerated Data Analysis:")
            print(data_analysis)
            
        # 4. Coding Agent
        technical_design = ""
        coding_task = extract_agent_task(plan, "CodingAgent")
        if coding_task:
            print(f"\nStep 4: Calling Coding Agent for: {coding_task}")
            technical_design = await run_coding(coding_task)
            print("\nGenerated Technical Design:")
            print(technical_design)

        # 5. Critic Agent
        print("\nStep 5: Calling Critic Agent to review everything...")
        combined_text = plan
        if research_summary: combined_text += f"\n\n{research_summary}"
        if data_analysis: combined_text += f"\n\n{data_analysis}"
        if technical_design: combined_text += f"\n\n{technical_design}"
        
        critic_review = await run_review(combined_text)
        print("\nGenerated Critic Review:")
        print(critic_review)
        
        # Final Verification Checks
        print("\n" + "="*50)
        print("VERIFICATION RESULTS:")
        print("="*50)
        
        sections = ["TASK PLAN:", "RESEARCH SUMMARY:", "DATA ANALYSIS:", "TECHNICAL DESIGN:", "CRITIC REVIEW:"]
        full_output = plan + research_summary + technical_design + data_analysis + critic_review
        missing_sections = [s for s in sections if s not in full_output]
        
        if not missing_sections:
            print("[SUCCESS] All expected sections are present.")
        else:
            print(f"[FAILED] Missing sections: {missing_sections}")
            
        # Check for concise output (rough line check)
        lines = full_output.split("\n")
        if len(lines) < 60:
            print(f"[SUCCESS] Response size appears controlled and concise ({len(lines)} lines).")
        else:
            print(f"[WARNING] Response might be too long: {len(lines)} lines.")
            
        # Check for stack awareness
        stack_terms = ["React", "FastAPI", "MySQL"]
        found_stack = [t for t in stack_terms if t in technical_design]
        if len(found_stack) >= 2:
            print(f"[SUCCESS] Stack awareness verified in CodingAgent: {found_stack}")
        else:
            print(f"[FAILED] Stack terms not found in TECHNICAL DESIGN. {found_stack}")

        # Check for RAG accuracy (Hostel fee Rs. 3000 should be there if RAG worked)
        if "3000" in research_summary or "3000" in data_analysis:
            print("[SUCCESS] RAG Accuracy: Found document-specific data (Rs. 3000).")
        else:
            print("[FAILED] RAG Accuracy: Could not find Rs. 3000 in agent outputs.")

    except Exception as e:
        print(f"\n[ERROR] Test failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_stabilized_orchestration())
