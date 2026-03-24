import logging
import json
import re
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

    async def generate_questions(self, role: str, interview_type: str, company: str = "Generic", round_type: Optional[str] = None, difficulty: str = "Intermediate", exclude_questions: Optional[List[str]] = None, user_type: str = "general", experience_years: int = 0, num_questions: int = 5, selected_topic: Optional[str] = None) -> List[Dict[str, Any]]:
        """Generate interview questions and model answers based on role, company, and round."""
        persona_data = COMPANY_PERSONAS.get(company.lower(), COMPANY_PERSONAS["general"])
        persona = persona_data["persona"]
        company_tip = persona_data["tip"]

        exclude_str = ""
        if exclude_questions:
            exclude_str = f"Do NOT include the following questions: " + ", ".join(exclude_questions)

        topic_focus = ""
        if selected_topic and selected_topic != "All topics":
            topic_focus = f"Focus all questions ONLY on the topic: {selected_topic}."

        prompt = f"""
        {persona}

        You are conducting a {round_type if round_type else interview_type} interview for the role
        of {role} at {company}. The candidate has {experience_years}
        year(s) of experience and is a {user_type}.

        {topic_focus}

        Generate exactly {num_questions} interview questions.
        Return a JSON array only. No explanation. No extra text.

        Each item in the array must have exactly these fields:
        {{
          "id": "unique_string_id",
          "question": "The actual question text",
          "topic": "{selected_topic if selected_topic else 'General'}",
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
        - {topic_focus}
        - IMPORTANT: If this is an 'Aptitude' or 'OA' round, strictly AVOID any programming, JavaScript, SQL or technical role-specific questions. Focus ONLY on logic, reasoning, or quantitative skills.
        - Ensure variety: mix conceptual, implementation, and behavioral/leadership questions as appropriate for {company}.
        """
        messages = [{"role": "system", "content": "You are an expert interviewer. Return only JSON data."},
                    {"role": "user", "content": prompt}]
        response = await self.llm.generate(messages)
        try:
            # Robust JSON extraction
            content = response.strip()
            if "```json" in content:
                content = content.split("```json")[-1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            start = content.find('[')
            end = content.rfind(']') + 1
            if start == -1 or end == 0:
                raise ValueError("No JSON array found in response")
                
            return json.loads(content[start:end])
        except Exception as e:
            logger.error(f"Error parsing interview questions: {e}")
            logger.debug(f"Raw response: {response}")
            # Try to find any list-like structure as a last resort
            try:
                matches = re.findall(r'\{.*?\}', response, re.DOTALL)
                if matches:
                    return [json.loads(m) for m in matches]
            except:
                pass
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
            content = response.strip()
            if "```json" in content:
                content = content.split("```json")[-1].split("```")[0].strip()
            
            start = content.find('{')
            end = content.rfind('}') + 1
            return json.loads(content[start:end])
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
            content = response.strip()
            if "```json" in content:
                content = content.split("```json")[-1].split("```")[0].strip()

            start = content.find('{')
            end = content.rfind('}') + 1
            result = json.loads(content[start:end])
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
            content = response.strip()
            if "```json" in content:
                content = content.split("```json")[-1].split("```")[0].strip()

            start = content.find('{')
            end = content.rfind('}') + 1
            return json.loads(content[start:end])
        except Exception as e:
            logger.error(f"Error parsing round summary: {e}")
            return {"what_went_well": "Completed the round.", "main_gap": "Continue practicing."}

    async def generate_final_report(self, role: str, company: str, round_results: List[Dict[str, Any]], overall_dimension_avgs: Dict[str, float]) -> Dict[str, Any]:
        weakest_dim = min(overall_dimension_avgs, key=lambda k: overall_dimension_avgs[k]) if overall_dimension_avgs else "Technical Basics"
        
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

    async def get_round_topics(self, company: str, round_type: str, role: str) -> List[str]:
        """List specific topics tested in a particular round for a company."""
        prompt = f"""
        You are an expert on {company}'s hiring process.
        List the specific topics that are tested in the {round_type} round for a {role} position at {company}.

        Return a JSON object only. No explanation. No extra text.
        {{
          "topics": [
            "topic name 1",
            "topic name 2",
            ...
          ]
        }}

        Return between 6 and 12 topics. Be specific to {company}'s known interview patterns.
        """
        messages = [{"role": "system", "content": "You are an expert recruiter. Return only JSON data."},
                    {"role": "user", "content": prompt}]
        response = await self.llm.generate(messages)
        try:
            start = response.find('{')
            end = response.rfind('}') + 1
            data = json.loads(response[start:end])
            return data.get("topics", [])
        except Exception as e:
            logger.error(f"Error parsing round topics: {e}")
            return ["Core Concepts", "Implementation", "Edge Cases", "Problem Solving", "Optimisation"]

    async def generate_mcq_questions(self, company: str, round_type: str, role: str, topic: Optional[str] = None, n: int = 5, previous_questions: List[str] = []) -> List[Dict[str, Any]]:
        """Generate multiple choice questions for aptitude/OA rounds."""
        exclude_str = ""
        if previous_questions:
            exclude_items = "\n".join([f"- {q}" for q in previous_questions])
            exclude_str = f"\n\nDO NOT repeat or include any of the following questions:\n{exclude_items}"

        prompt = f"""
        You are an expert {company} aptitude interviewer.
        Generate exactly {n} multiple choice questions for the {round_type} round. Role: {role}. Topic: {topic if topic else "General Aptitude"}.

        Each question must match {company}'s known OA difficulty and style.
        
        IMPORTANT: This is a pure Aptitude/OA round. Do NOT include ANY programming, JavaScript, SQL, or technical role-specific questions. Focus EXCLUSIVELY on the selected topic: {topic if topic else "General Aptitude"}.{exclude_str}

        Return a JSON array only. No explanation. No extra text.
        [
          {{
            "id": "mcq_id",
            "question": "string",
            "topic": "{topic if topic else 'Aptitude'}",
            "difficulty": "medium",
            "options": {{
              "A": "option text",
              "B": "option text",
              "C": "option text",
              "D": "option text"
            }},
            "correct_option": "A",
            "explanation": "detailed explanation of the solution",
            "shortcut_trick": "a fast mental trick to solve this type of question quickly"
          }}
        ]
        """
        messages = [{"role": "system", "content": "You are an expert OA interviewer. Return only JSON data."},
                    {"role": "user", "content": prompt}]
        response = await self.llm.generate(messages)
        try:
            content = response.strip()
            if "```json" in content:
                content = content.split("```json")[-1].split("```")[0].strip()

            start = content.find('[')
            end = content.rfind(']') + 1
            if start == -1 or end == 0:
                logger.error(f"No JSON array found in response: {response}")
                return []
            return json.loads(content[start:end])
        except Exception as e:
            logger.error(f"Error parsing MCQ questions: {e}")
            logger.debug(f"Raw response: {response}")
            return []

    async def teach_topic(self, company: str, role: str, round_type: str, topic: str) -> Dict[str, Any]:
        """Generate a comprehensive study guide for a specific topic."""
        prompt = f"""
        You are an expert interview coach preparing a candidate for {company}'s {round_type} round for the role of {role}.
        Teach the topic: {topic}

        Structure your response as JSON only.
        {{
          "topic": "{topic}",
          "what_it_is": "explanation",
          "why_it_matters_at_company": "why {company} tests this",
          "core_concepts": [
            {{
              "concept": "name",
              "explanation": "clear info",
              "example": "concrete case"
            }}
          ],
          "patterns_and_tricks": ["tip 1", "tip 2"],
          "common_mistakes": ["mistake 1", "mistake 2"],
          "sample_question": "example question",
          "one_liner_to_remember": "memorable summary"
        }}
        """
        messages = [{"role": "system", "content": "You are an expert interview coach. Return only JSON data."},
                    {"role": "user", "content": prompt}]
        response = await self.llm.generate(messages)
        try:
            start = response.find('{')
            end = response.rfind('}') + 1
            return json.loads(response[start:end])
        except Exception as e:
            logger.error(f"Error in teach_topic: {e}")
            return {
                "topic": topic,
                "what_it_is": f"Detailed guide for {topic}",
                "why_it_matters_at_company": "Critical for the target role.",
                "core_concepts": [],
                "patterns_and_tricks": [],
                "common_mistakes": [],
                "sample_question": "Explain the core concepts of this topic.",
                "one_liner_to_remember": "Master the basics to excel in advanced applications."
            }

    async def predict_company_process(self, company: str, role: str) -> Dict[str, Any]:
        """Predict the interview rounds for a specific company and role using LLM knowledge."""
        prompt = f"""
        Research and predict the standard interview process for the company: {company} 
        and the role: {role}.
        
        A typical process includes several rounds. Common rounds are:
        - Aptitude/OA (Online Assessment)
        - Technical Interview (DSA/Coding)
        - System Design / Technical Basics
        - Managerial / TR+MR
        - HR Interview
        
        Return exactly this JSON format:
        {{
          "rounds": ["Round 1 Name", "Round 2 Name", "Round 3 Name", ...],
          "justification": "Brief explanation of why this process is predicted for this company"
        }}
        
        Return ONLY valid JSON.
        """
        
        messages = [{"role": "system", "content": "You are a recruitment consultant specializing in tech hiring patterns. Return only JSON."},
                    {"role": "user", "content": prompt}]
        
        response = await self.llm.generate(messages)
        try:
            content = response.strip()
            if "```json" in content:
                content = content.split("```json")[-1].split("```")[0].strip()
            
            start = content.find('{')
            end = content.rfind('}') + 1
            data = json.loads(content[start:end])
            return {
                "company": company,
                "role": role,
                "rounds": data.get("rounds", ["Technical", "HR"]),
                "justification": data.get("justification", "Standard industry practice.")
            }
        except Exception as e:
            logger.error(f"Error predicting company process: {e}")
            return {
                "company": company,
                "role": role,
                "rounds": ["Technical Interview", "HR Interview"],
                "justification": "Default standard process fallback."
            }
