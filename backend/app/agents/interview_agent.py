import logging
import json
from typing import List, Dict, Any
from app.llm.factory import get_llm_provider
from app.core.config import get_settings

logger = logging.getLogger(__name__)

class InterviewPreparationAgent:
    def __init__(self):
        self.llm = get_llm_provider()
        self.settings = get_settings()

    async def generate_questions(self, role: str, interview_type: str, exclude_questions: List[str] = None) -> List[Dict[str, Any]]:
        """Generate interview questions and model answers based on role and type."""
        exclude_str = ""
        if exclude_questions:
            exclude_str = f"Do NOT include the following questions:\n- " + "\n- ".join(exclude_questions)

        prompt = f"""
        Act as an expert interviewer for the position of {role}.
        Generate a list of 5 relevant interview questions for a {interview_type}.
        For each question, provide a suggested model answer that a high-quality candidate would give.

        Format your response as a JSON array of objects:
        [
            {{
                "id": <sequential_id>,
                "question": "Question text here...",
                "suggested_answer": "Model answer text here..."
            }},
            ...
        ]

        Context & Rules:
        - Job Role: {role}
        - Interview Type: {interview_type}
        - {exclude_str}
        - If the type is 'Aptitude Test', focus on logical reasoning, quantitative aptitude, and situational judgment related to the role.
        
        ONLY return the JSON array. Do not include any other text.
        """
        messages = [{"role": "system", "content": "You are an expert interviewer. Return only JSON data."},
                    {"role": "user", "content": prompt}]
        response = await self.llm.generate(messages)
        try:
            start = response.find('[')
            end = response.rfind(']') + 1
            return json.loads(response[start:end])
        except Exception as e:
            logger.error(f"Error parsing interview questions: {e}")
            logger.debug(f"Raw response: {response}")
            return []

    async def clarify_doubt(self, role: str, question: str, context: str, user_query: str) -> Dict[str, Any]:
        """Help the user clarify a doubt about a question or answer."""
        prompt = f"""
        You are a supportive interview coach helping a candidate prepare for an {role} role.
        The candidate has a doubt about this interview question:
        "{question}"
        
        Additional Context (Model Answer or Candidate Response):
        "{context}"
        
        Candidate's Query:
        "{user_query}"
        
        Provide a clear, helpful explanation to address their doubt. Also suggest 1-2 follow-up tips or topics.
        
        Format your response as a JSON object:
        {{
            "answer": "Your detailed explanation here...",
            "suggestions": ["suggestion 1", "suggestion 2"]
        }}
        
        ONLY return the JSON object. Do not include any other text.
        """
        messages = [{"role": "system", "content": "You are an expert interview coach. Return only JSON data."},
                    {"role": "user", "content": prompt}]
        response = await self.llm.generate(messages)
        try:
            start = response.find('{')
            end = response.rfind('}') + 1
            return json.loads(response[start:end])
        except Exception as e:
            logger.error(f"Error clarifying doubt: {e}")
            return {
                "answer": "I'm sorry, I couldn't process your query right now. Please try rephrasing.",
                "suggestions": ["Try again", "Focus on basics"]
            }

    async def analyze_answer(self, role: str, question: str, user_answer: str) -> Dict[str, Any]:
        """Analyze user's answer and provide feedback."""
        prompt = f"""
        You are an interviewer evaluating a candidate for the role of {role}.
        The candidate was asked the following question:
        "{question}"
        
        The candidate provided this answer:
        "{user_answer}"
        
        Analyze the answer and provide structured feedback.
        Return a JSON object with:
        - clarity_score (integer 0-100)
        - feedback (general comments about their response)
        - missing_points (list of key concepts or points they missed)
        - suggestions (list of specific ways to improve the answer)

        Format:
        {{
            "clarity_score": 85,
            "feedback": "...",
            "missing_points": ["point 1", "point 2"],
            "suggestions": ["suggestion 1", "suggestion 2"]
        }}
        
        ONLY return the JSON object. Do not include any other text.
        """
        messages = [{"role": "system", "content": "You are an expert interviewer evaluating answers. Return only JSON data."},
                    {"role": "user", "content": prompt}]
        response = await self.llm.generate(messages)
        try:
            start = response.find('{')
            end = response.rfind('}') + 1
            return json.loads(response[start:end])
        except Exception as e:
            logger.error(f"Error parsing interview feedback: {e}")
            logger.debug(f"Raw response: {response}")
            return {
                "clarity_score": 0,
                "feedback": "Error processing feedback analysis.",
                "missing_points": [],
                "suggestions": []
            }

    async def generate_learning_suggestions(self, questions: List[Dict[str, Any]]) -> List[str]:
        """Suggest topics to study based on the questions."""
        question_texts = [q.get('question', '') for q in questions]
        prompt = f"""
        Based on these interview questions:
        {json.dumps(question_texts)}
        
        Suggest 3-5 core topics or areas of study that a candidate should review to be well-prepared for these types of questions.
        Return as a JSON array of strings.
        
        ONLY return the JSON array. Do not include any other text.
        """
        messages = [{"role": "system", "content": "You are a career mentor. Return only JSON data."},
                    {"role": "user", "content": prompt}]
        response = await self.llm.generate(messages)
        try:
            start = response.find('[')
            end = response.rfind(']') + 1
            return json.loads(response[start:end])
        except Exception as e:
            logger.error(f"Error parsing learning suggestions: {e}")
            logger.debug(f"Raw response: {response}")
            return []
