"""
Career Agent.
"""

from __future__ import annotations

import logging
from typing import AsyncIterator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.llm.factory import get_llm_provider
from app.models.career import StudentCareerProfile

logger = logging.getLogger(__name__)

class CareerAgent:
    """
    Agent responsible for personalized career advice.
    Collects a 6-question profile natively if it does not exist.
    """

    def __init__(self):
        self.llm = get_llm_provider()
        self.system_prompt = """
You are a proactive, knowledgeable, and motivating Career Agent for Campus AI.

Your role is to act as a personal career mentor for students.

Response Style:
* Clear and motivating
* Action-oriented
* Structured suggestions (steps, bullet points, roadmaps)
"""

    async def get_or_create_profile(self, user_id: int, db: AsyncSession) -> tuple[StudentCareerProfile, bool]:
        """
        Retrieves the profile. If it doesn't exist, creates an empty one.
        Returns the profile and a boolean indicating if it was newly created.
        """
        result = await db.execute(select(StudentCareerProfile).where(StudentCareerProfile.user_id == user_id))
        profile = result.scalar_one_or_none()
        if not profile:
            profile = StudentCareerProfile(user_id=user_id)
            db.add(profile)
            await db.commit()
            await db.refresh(profile)
            return profile, True
        return profile, False

    def _get_next_missing_field(self, profile: StudentCareerProfile) -> str | None:
        """
        Returns the next required onboarding question field.
        """
        if not profile.degree_program: return "degree_program"
        if not profile.current_year: return "current_year"
        if not profile.interests: return "interests"
        if not profile.skills: return "skills"
        if not profile.career_goals: return "career_goals"
        if not profile.preferred_path: return "preferred_path"
        return None

    def _get_question_for_field(self, field: str) -> str:
        """Returns the specific question text for a field."""
        questions = {
            "degree_program": "Welcome to Career Agent! Let's build your profile. What degree or course are you currently studying?",
            "current_year": "What year are you in? (1st, 2nd, 3rd, Final year, etc.)",
            "interests": "What subjects or domains interest you the most?",
            "skills": "What skills do you already have? (e.g., programming, design, communication)",
            "career_goals": "What career paths are you currently considering?",
            "preferred_path": "What type of career do you prefer? (Software development, Research, Entrepreneurship, Government jobs, Higher studies, Not sure yet)"
        }
        return questions.get(field, "Tell me more about yourself.")

    async def update_profile_field(self, profile: StudentCareerProfile, field: str, user_message: str, db: AsyncSession):
        """Save the user's answer into the missing profile field."""
        setattr(profile, field, user_message)
        await db.commit()
        await db.refresh(profile)

    async def generate_response(self, user_id: int, query: str, db: AsyncSession) -> str:
        """
        Generates a full response. Handles onboarding logically.
        """
        profile, is_new = await self.get_or_create_profile(user_id, db)
        missing_field = self._get_next_missing_field(profile)

        # If it's a new profile or ongoing onboarding, the incoming query is likely their answer 
        if not is_new and missing_field and query.strip():
            # Save their previous answer to the previously missing field ONLY if it wasn't the first hi
            # Determining this precisely here is tricky if they just said "hi", but we assume any input goes to the current missing field unless it's just "hi".
            if query.strip().lower() not in ["hi", "hello", "hey", "start"]:
                await self.update_profile_field(profile, missing_field, query, db)
                # re-evaluate missing field since we just updated it
                missing_field = self._get_next_missing_field(profile)

        # If there's still a missing field, ask the question
        if missing_field:
            return self._get_question_for_field(missing_field)

        # Profile is complete, add context and query LLM
        context = f"""
--- Student Career Profile ---
Degree: {profile.degree_program}
Year: {profile.current_year}
Interests: {profile.interests}
Skills: {profile.skills}
Goals: {profile.career_goals}
Preferred Path: {profile.preferred_path}
-------------------------------
Please personalize your advice heavily based on the student's profile above.
"""
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": f"Context:\n{context}\n\nQuery: {query}"}
        ]
        
        try:
            return await self.llm.generate(messages)
        except Exception as e:
            logger.error(f"CareerAgent failed: {e}")
            raise

    async def stream_response(self, user_id: int, query: str, db: AsyncSession) -> AsyncIterator[str]:
        """
        Streams response. Onboarding questions are yielded directly, else streamed from LLM.
        """
        profile, is_new = await self.get_or_create_profile(user_id, db)
        missing_field = self._get_next_missing_field(profile)

        if not is_new and missing_field and query.strip():
            if query.strip().lower() not in ["hi", "hello", "hey", "start", "career agent"]:
                await self.update_profile_field(profile, missing_field, query, db)
                missing_field = self._get_next_missing_field(profile)

        if missing_field:
            yield self._get_question_for_field(missing_field)
            return

        context = f"""
--- Student Career Profile ---
Degree: {profile.degree_program}
Year: {profile.current_year}
Interests: {profile.interests}
Skills: {profile.skills}
Goals: {profile.career_goals}
Preferred Path: {profile.preferred_path}
-------------------------------
Please personalize your advice heavily based on the student's profile above.
"""
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": f"Context:\n{context}\n\nUser Question: {query}"}
        ]
        
        try:
            async for token in self.llm.stream(messages):
                yield token
        except Exception as e:
            logger.error(f"CareerAgent streaming failed: {e}")
            raise
