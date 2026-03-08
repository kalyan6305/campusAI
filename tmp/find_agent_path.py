import sys
import os
from pathlib import Path

# Add backend to path
sys.path.append(r"d:\projects\campus_ai\backend")

try:
    from app.agents.research_agent import ResearchAgent
    print(f"SUCCESS: {ResearchAgent.__module__}")
    import app.agents.research_agent
    print(f"FILE: {app.agents.research_agent.__file__}")
except Exception as e:
    print(f"FAILED: {e}")
    import traceback
    traceback.print_exc()
