import asyncio
import os
import sys

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.agents.job_apply_agent import JobApplyAgent

async def test_job_apply_pipeline():
    agent = JobApplyAgent()
    
    # Test text resume parsing
    resume_content = b"Kalyan - Software Engineer. Skills: Python, React, FastAPI. Experience: Worked at Campus AI for 2 years."
    resume_text = await agent.parse_resume(resume_content, "resume.txt")
    print(f"Parsed Resume: {resume_text[:50]}...")
    
    # Test JD analysis
    jd_text = "Looking for a Python Developer proficient in FastAPI and React. 3+ years of experience required."
    jd_analysis = await agent.analyze_job_description(jd_text)
    print("JD Analysis completed.")
    
    # Test link analysis (using a local playground or common site if possible, but let's just mock/check if it runs)
    # Note: Real scraping requires the browser, which we've installed.
    # We'll use a local file for testing if needed, but here we just check if it's integrated.
    print("Testing Job Link Analysis (Simulated)...")
    # Using a dummy URL to check error handling/flow
    link_analysis = await agent.analyze_job_link("https://example.com/jobs/1")
    print(f"Link Analysis Keys: {list(link_analysis.keys())}")
    
    # Test Application Data Preparation
    print("Preparing Application Data...")
    app_data = await agent.prepare_application_data(resume_text, link_analysis)
    print(f"Prepared Data Keys: {list(app_data.keys())}")
    print(f"Questions for User: {app_data.get('questions_for_user', [])}")
    
    # Test Optimization
    print("Optimizing Resume...")
    optimized = await agent.optimize_resume(resume_text, jd_text)
    print(f"Optimized Resume length: {len(optimized)}")

if __name__ == "__main__":
    asyncio.run(test_job_apply_pipeline())
