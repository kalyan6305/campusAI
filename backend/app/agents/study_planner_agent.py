import json
import logging
import asyncio
from typing import AsyncIterator, List, Dict, Any, Literal
from pydantic import BaseModel, Field
from cachetools import TTLCache
from app.llm.factory import get_llm_provider
from app.services.web_search_service import web_search_service

logger = logging.getLogger(__name__)

class TopicItem(BaseModel):
    day: int
    week: int
    topic: str
    detail: str
    hours: float
    difficulty: Literal["Easy", "Medium", "Hard"]
    rationale: str

class StudyPlan(BaseModel):
    subject: str
    level: str
    total_days: int
    hours_per_day: float
    exam_date: str | None = None
    weeks: List[Dict[str, Any]] # Grouped by week for frontend convenience
    all_topics: List[TopicItem]

class StudyPlannerAgent:
    """
    Advanced Study Planner Agent with Research, Caching, and Structured JSON output.
    """

    def __init__(self):
        self.llm = get_llm_provider()
        # Cache by (subject + level), 24h TTL
        self.cache = TTLCache(maxsize=100, ttl=86400)
        self.system_prompt = """
You are a world-class Academic Strategist and Study Planner for Campus AI. 
Your goal is to create highly effective, research-backed study plans that help students master subjects.

INPUTS:
- Subject/Course Name
- Student Level (Beginner/Intermediate/Advanced)
- Available Days & Hours per Day
- Exam Date (Optional)
- Research Context (Actual syllabus/topics found via web search)

OUTPUT FORMAT:
You MUST respond ONLY with a valid JSON object matching this structure:
{
  "subject": "Name",
  "level": "Level",
  "total_days": 30,
  "hours_per_day": 2,
  "exam_date": "YYYY-MM-DD or null",
  "weeks": [
    {
      "week_number": 1,
      "week_rationale": "Why this order?",
      "topics": [...]
    }
  ],
  "all_topics": [
    {
      "day": 1,
      "week": 1,
      "topic": "Topic Title",
      "detail": "Actionable study goals",
      "hours": 2,
      "difficulty": "Easy/Medium/Hard",
      "rationale": "Why today?"
    }
  ]
}

STRATEGY:
1. Divide the topics logically across the available days.
2. Group topics by week (7 days per week).
3. Set difficulty based on the level.
4. Ensure the total hours prescribed per day match the user's input.
5. If an exam date is provided, prioritize high-weightage topics earlier.
"""

    async def generate_plan(self, subject: str, level: str, days: int, hours: float, exam_date: str = None) -> Dict[str, Any]:
        """
        Main entry point for generating a study plan with research.
        """
        cache_key = f"{subject.lower()}_{level.lower()}"
        if cache_key in self.cache:
            logger.info(f"Cache hit for study plan: {cache_key}")
            return self.cache[cache_key]

        # Step 1: Research (Web Search)
        search_query = f"{subject} syllabus {level} undergraduate course topics"
        search_data = await web_search_service.search(search_query)
        context = "--- Research Context ---\n"
        for res in search_data.get("results", []):
            context += f"Source: {res['source']}\nTitle: {res['title']}\nSnippet: {res['snippet']}\n\n"

        # Step 2: Synthesis with LLM
        user_input = f"""
Subject: {subject}
Level: {level}
Days: {days}
Hours/Day: {hours}
Exam Date: {exam_date or 'Not provided'}

{context}
"""
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": user_input}
        ]

        try:
            # 90s hard timeout — gemini-2.0-flash is fast, but large plans need headroom
            response_text = await asyncio.wait_for(self.llm.generate(messages), timeout=90.0)
            
            # Extract JSON from potential markdown blocks
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            plan_data = json.loads(response_text)
            
            # Validate with Pydantic
            validated_plan = StudyPlan(**plan_data)
            final_data = validated_plan.model_dump()
            
            # Cache it
            self.cache[cache_key] = final_data
            return final_data
            
        except asyncio.TimeoutError:
            logger.error("Study plan generation timed out")
            raise Exception("Generation timed out. Please try again.")
        except Exception as e:
            logger.error(f"StudyPlannerAgent failed: {e}")
            raise

    # Keep compatibility with existing chat flow if needed, but the new UI will use generate_plan
    async def generate_response(self, query: str) -> str:
        return "Please use the specialized Study Planner UI for generating plans."
