import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.agents.job_assistant_agent import JobFinderAgent

async def verify():
    print("Initializing JobFinderAgent...")
    agent = JobFinderAgent()
    
    role = "Software Engineer"
    user_profile = {
        "level": "fresher",
        "degree": "B.Tech CS",
        "skills": ["Python", "JavaScript", "FastAPI"]
    }
    location = "India"
    
    print(f"Searching for {role} jobs in {location}...")
    jobs = await agent.search_jobs(role, user_profile, location)
    
    print(f"Found {len(jobs)} jobs.")
    for i, job in enumerate(jobs):
        print(f"\n--- Job {i+1} ---")
        print(f"Title: {job.get('title')}")
        print(f"Company: {job.get('company')}")
        print(f"Source: {job.get('source')}")
        print(f"AI Summary: {job.get('ai_summary')}")
        print(f"Match Score: {job.get('match_score')}")
        print(f"Tips: {job.get('tips')}")
        if i >= 2: break # Only show first 3

if __name__ == "__main__":
    try:
        asyncio.run(verify())
    except Exception:
        import traceback
        traceback.print_exc()
