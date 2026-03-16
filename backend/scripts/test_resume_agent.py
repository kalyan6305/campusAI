import asyncio
import os
import sys

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.agents.resume_agent import ResumeAgent
from app.agents.critic_agent import CriticAgent
from app.agents.report_agent import ReportAgent

async def test_resume_pipeline():
    print("--- 🧪 Testing Resume Optimization Pipeline ---")
    
    resume_agent = ResumeAgent()
    critic_agent = CriticAgent()
    report_agent = ReportAgent()
    
    sample_resume = """
    John Doe
    Software Engineer
    Skills: Python, Java, SQL.
    Experience: 
    Software Developer at TechCorp (2020-2023). Developed web apps.
    Education: BS in Computer Science.
    """
    
    sample_jd = """
    Senior Python Developer
    Required Skills: Python, FastAPI, AWS, PostgreSQL.
    Responsibilities: Build scalable backend services and lead a team.
    """
    
    print("\n1. Analyzing Resume & JD...")
    resume_analysis = await resume_agent.analyze_resume(sample_resume)
    jd_analysis = await resume_agent.analyze_job_description(sample_jd)
    print("✅ Analysis Complete")
    
    print("\n2. Matching Skills...")
    matching_results = await resume_agent.match_skills(resume_analysis, jd_analysis)
    print(f"✅ Matching Done: {matching_results['match_data'][:100]}...")
    
    print("\n3. Optimizing Resume...")
    optimized_raw = await resume_agent.optimize_resume(sample_resume, sample_jd)
    print("✅ Optimization Done")
    
    print("\n4. Critic Review...")
    context = f"Resume info: {sample_resume[:100]}\nJD info: {sample_jd[:100]}"
    final_resume = await critic_agent.review(optimized_raw, context)
    print("✅ Critic Review Done")
    
    print("\n5. Generating Final Report...")
    final_report = report_agent.format_final_report(
        final_resume,
        matching_results['match_data'],
        "Add more details about FastAPI experience."
    )
    print("✅ Final Report Generated")
    print("\n--- 📄 Final Report Preview ---")
    print(final_report[:500] + "...")
    print("\n--- ✅ Test Passed ---")

if __name__ == "__main__":
    asyncio.run(test_resume_pipeline())
