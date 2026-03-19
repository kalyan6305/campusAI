import logging
import json
from typing import List, Dict, Any, Optional
from app.llm.factory import get_llm_provider
from app.core.config import get_settings

COMPANY_PERSONAS = {
  "amazon": {
    "persona": "You are a strict Amazon interviewer. You expect candidates to think aloud, always state time and space complexity, handle edge cases proactively, and connect behavioral answers to Amazon Leadership Principles.",
    "tip": "Amazon expects you to state complexity before coding and handle all edge cases explicitly."
  },
  "google": {
    "persona": "You are a Google interviewer. You prioritise elegant optimal solutions, clean code structure, and the ability to identify multiple approaches before choosing the best one.",
    "tip": "Google values optimal solutions over brute force. Always discuss trade-offs between approaches."
  },
  "microsoft": {
    "persona": "You are a Microsoft interviewer. You value object-oriented design, clean abstractions, and the ability to extend a solution to new requirements.",
    "tip": "Microsoft often asks you to extend your solution. Design it to be modifiable from the start."
  },
  "flipkart": {
    "persona": "You are a Flipkart interviewer. You focus on practical problem solving, system scalability, and real-world application of data structures.",
    "tip": "Flipkart values practical thinking. Relate your solution to real-world scale scenarios."
  },
  "startup": {
    "persona": "You are a startup interviewer. You care about versatility, speed of delivery, product thinking, and ownership mindset over theoretical perfection.",
    "tip": "Startups value shipping fast and owning outcomes. Show initiative and practical thinking."
  },
  "general": {
    "persona": "You are an experienced technical interviewer. You value clear thinking, correct solutions, good communication, and awareness of edge cases.",
    "tip": "Focus on clarity, correctness, and covering edge cases in every answer."
  }
}

logger = logging.getLogger(__name__)

class InterviewPreparationAgent:
    COMPANY_ROUND_PATTERNS = {
        "Google": ["DSA", "System Design", "Behavioral"],
        "Amazon": ["DSA", "Leadership Principles", "System Design"],
        "Microsoft": ["DSA", "Coding", "HR"],
        "TCS": ["Aptitude", "Basic Coding", "HR"],
        "Infosys": ["Aptitude", "Technical Basics", "HR"],
        "Generic": ["Technical", "HR"]
    }

    def __init__(self):
        self.llm = get_llm_provider()
        self.settings = get_settings()

    async def generate_questions(self, role: str, interview_type: str, company: str = "Generic", round_type: Optional[str] = None, difficulty: str = "Intermediate", exclude_questions: Optional[List[str]] = None, user_type: str = "general", experience_years: int = 0, num_questions: int = 5) -> List[Dict[str, Any]]:
        """Generate interview questions and model answers based on role, company, and round."""
        persona_data = COMPANY_PERSONAS.get(company.lower(), COMPANY_PERSONAS["general"])
        persona = persona_data["persona"]
        company_tip = persona_data["tip"]

        exclude_str = ""
        if exclude_questions:
            exclude_str = f"Do NOT include the following questions: " + ", ".join(exclude_questions)

        prompt = f"""
        {persona}

        You are conducting a {round_type if round_type else interview_type} interview for the role
        of {role} at {company}. The candidate has {experience_years}
        year(s) of experience and is a {user_type}.

        Generate exactly {num_questions} interview questions.
        Return a JSON array only. No explanation. No extra text.

        Each item in the array must have exactly these fields:
        {{
          "id": "unique_string_id",
          "question": "The actual question text",
          "topic": "The specific technical or behavioral topic",
          "difficulty": "{difficulty}",
          "suggested_answer": "A comprehensive model answer that demonstrates senior-level thinking",
          "expected_signals": [
            "specific signal 1",
            "specific signal 2"
          ],
          "follow_up_probes": [
            "probing question 1 if the answer is too high-level",
            "probing question 2"
          ],
          "company_tip": "{company_tip}"
        }}

        Context & Rules:
        - {exclude_str}
        - Focus on {round_type if round_type else "general competency"}.
        - Ensure variety: mix conceptual, implementation, and behavioral/leadership questions as appropriate for {company}.
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

    async def analyze_answer(self, role: str, question: str, user_answer: str, expected_signals: Optional[List[str]] = None, follow_up_probes: Optional[List[str]] = None, hint_used: bool = False) -> Dict[str, Any]:
        """Analyze user's answer and provide feedback."""
        hint_penalty_instruction = ""
        if hint_used:
            hint_penalty_instruction = "The candidate used a hint. Subtract 10 from the overall score. Add the note 'Hint used (−10 pts)' to suggestions."

        prompt = f"""
        You are an experienced interviewer evaluating a candidate's
        answer for the role of {role}.

        Question: {question}
        Expected signals: {json.dumps(expected_signals) if expected_signals else "Demonstrate core competency"}
        Candidate's answer: {user_answer}

        Evaluate on exactly 4 dimensions (score each 0 to 100):
          - depth: Did they cover the core concept thoroughly?
          - edge_cases: Did they mention boundary conditions or edge cases?
          - communication: Was the explanation clear and structured?
          - correctness: Is the answer technically accurate?

        Compute overall = average of the four scores.

        {hint_penalty_instruction}

        Then check: is any individual dimension score below 60?
          - If YES: set follow_up_question to the most relevant probe from this list: {json.dumps(follow_up_probes) if follow_up_probes else "[]"}
          - If NO: set follow_up_question to null

        Return JSON only. No explanation. No extra text.
        {{
          "scores": {{
            "depth": int,
            "edge_cases": int,
            "communication": int,
            "correctness": int,
            "overall": int
          }},
          "clarity_score": int,
          "what_was_good": "one specific sentence of praise",
          "missing_points": ["list of key points the answer missed"],
          "suggestions": ["list of 1-2 improvement tips"],
          "follow_up_question": "string or null",
          "interviewer_reaction": "one short sentence a real interviewer would say after hearing this answer"
        }}
        """
        messages = [{"role": "system", "content": "You are an expert interviewer evaluating answers. Return only JSON data."},
                    {"role": "user", "content": prompt}]
        response = await self.llm.generate(messages)
        try:
            start = response.find('{')
            end = response.rfind('}') + 1
            result = json.loads(response[start:end])
            # Ensure clarity_score = overall for backward compatibility
            if "scores" in result and "overall" in result["scores"]:
                result["clarity_score"] = result["scores"]["overall"]
            return result
        except Exception as e:
            logger.error(f"Error parsing interview feedback: {e}")
            logger.debug(f"Raw response: {response}")
            return {
                "scores": {"depth": 0, "edge_cases": 0, "communication": 0, "correctness": 0, "overall": 0},
                "clarity_score": 0,
                "what_was_good": "N/A",
                "missing_points": [],
                "suggestions": ["Error processing feedback analysis."],
                "follow_up_question": None,
                "interviewer_reaction": "Let's move on."
            }

    async def generate_round_summary(self, role: str, company: str, round_name: str, dimension_avgs: Dict[str, float]) -> Dict[str, Any]:
        """Generate a round-level summary with dimension breakdowns."""
        avg_depth = dimension_avgs.get("depth", 0)
        avg_edge_cases = dimension_avgs.get("edge_cases", 0)
        avg_communication = dimension_avgs.get("communication", 0)
        avg_correctness = dimension_avgs.get("correctness", 0)

        prompt = f"""
        You are an experienced interviewer summarized a {round_name} interview round for a {role} at {company}.
        
        Round performance breakdown:
          Depth avg: {avg_depth}
          Edge cases avg: {avg_edge_cases}
          Communication avg: {avg_communication}
          Correctness avg: {avg_correctness}

        Based on this breakdown, generate:
          - what_went_well: one sentence about the strongest dimension
          - main_gap: one sentence about the weakest dimension and what specifically to improve

        Return JSON only:
        {{
          "what_went_well": "string",
          "main_gap": "string"
        }}
        """
        messages = [{"role": "system", "content": "You are an expert interviewer. Return only JSON data."},
                    {"role": "user", "content": prompt}]
        response = await self.llm.generate(messages)
        try:
            start = response.find('{')
            end = response.rfind('}') + 1
            return json.loads(response[start:end])
        except Exception as e:
            logger.error(f"Error parsing round summary: {e}")
            return {"what_went_well": "Completed the round.", "main_gap": "Continue practicing."}

    async def generate_final_report(self, role: str, company: str, round_results: List[Dict[str, Any]], overall_dimension_avgs: Dict[str, float]) -> Dict[str, Any]:
        weakest_dim = min(overall_dimension_avgs, key=overall_dimension_avgs.get) if overall_dimension_avgs else "Technical Basics"
        
        prompt = f"""
        Acting as a senior hiring manager at {company if company != "Generic" else "a top tech firm"},
        generate a professional interview report for a candidate who just completed a multi-round interview for the role of {role}.

        Session Performance Breakdown:
        {json.dumps(round_results, indent=2)}

        Average performance across all rounds by dimension:
        {json.dumps(overall_dimension_avgs, indent=2)}

        Generate a JSON report including:
        - overall_score (0-100)
        - round_scores (dictionary of round name to score)
        - strengths (list of key positive traits)
        - weaknesses (list of areas needing improvement)
        - selection_probability (percentage string)
        - learning_plan (list of 3 study topics, ordered by gap severity)
        - next_focus (a one-sentence tactical advice focusing on the weakest dimension: {weakest_dim})

        Return ONLY the JSON object:
        {{
            "overall_score": 75,
            "round_scores": {{"DSA": 80, "System Design": 70}},
            "strengths": ["...", "..."],
            "weaknesses": ["...", "..."],
            "selection_probability": "75%",
            "learning_plan": ["...", "..."],
            "next_focus": "..."
        }}
        """
        messages = [{"role": "system", "content": "You are a senior hiring manager. Return only JSON data."},
                    {"role": "user", "content": prompt}]
        response = await self.llm.generate(messages)
        try:
            start = response.find('{')
            end = response.rfind('}') + 1
            return json.loads(response[start:end])
        except Exception as e:
            logger.error(f"Error parsing final report: {e}")
            return {
                "overall_score": 0,
                "round_scores": {},
                "strengths": [],
                "weaknesses": [],
                "selection_probability": "0%",
                "learning_plan": ["Review basics"],
                "next_focus": "Review the core concepts."
            }
