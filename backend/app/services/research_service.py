import json  # type: ignore
import logging
import re
from typing import AsyncIterator, Dict, Any, List
import asyncio

from app.llm.factory import get_llm_provider  # type: ignore
from app.services.web_search_service import web_search_service  # type: ignore
from app.services.social_search_service import social_search_service  # type: ignore

logger = logging.getLogger(__name__)

class ResearchService:
    """
    Research Service implementing the ReAct pattern (Thought -> Action -> Observation).
    Supports 'fast' (1 search) and 'deep' (multiple searches + synthesis) modes.
    Now integrates multi-source intelligence (Web, YouTube, HackerNews, Wikipedia).
    """

    def __init__(self):
        self.llm = get_llm_provider()
        self.max_iterations = {
            "fast": 1,
            "deep": 3
        }

    async def generate_search_queries(self, query: str) -> List[str]:
        """
        Generates high-quality search queries based on the user's initial question.
        """
        prompt = f"""
        You are a Research Assistant. Generate 3 high-quality web search queries 
        that would help research and answer the following question.
        
        Question: {query}
        
        Return ONLY a JSON array of 3 strings.
        Example: ["query 1", "query 2", "query 3"]
        """
        try:
            response = await self.llm.generate([{"role": "user", "content": prompt}])
            # Extract JSON from response
            json_match = re.search(r"(\[.*\])", response, re.DOTALL)
            if json_match:
                queries = json.loads(json_match.group(1))
                if isinstance(queries, list) and len(queries) > 0:
                    return queries[:3]  # type: ignore
        except Exception as e:
            logger.error(f"Error generating research queries: {e}")
        
        return [query]

    def _compute_agreement_scores(self, sources: List[Dict[str, Any]]) -> None:
        """
        Simple heuristic to boost agreement_score if terms overlap significantly 
        across different sources.
        """
        # In a real system, this could use embeddings or LLM evaluation.
        # For efficiency, we do a basic keyword overlap check.
        for i, s1 in enumerate(sources):
            # Extract basic terms (alphanumeric, >4 chars)
            terms1 = set(re.findall(r'\b[a-zA-Z0-9]{5,}\b', (s1.get("snippet", "") + " " + s1.get("title", "")).lower()))
            if not terms1:
                continue
                
            agreement_count = 0
            for j, s2 in enumerate(sources):
                if i == j:
                    continue
                terms2 = set(re.findall(r'\b[a-zA-Z0-9]{5,}\b', (s2.get("snippet", "") + " " + s2.get("title", "")).lower()))
                
                # If there's >20% overlap in significant terms, count as agreement
                intersection = terms1.intersection(terms2)
                if len(intersection) > len(terms1) * 0.2:
                     agreement_count += 1  # type: ignore
            
            s1["agreement_score"] = agreement_count

    async def execute_multi_source_search(self, query: str) -> List[Dict[str, Any]]:
        """
        Executes search across web and social platforms concurrently.
        """
        # Execute Serper and Social sources in parallel
        web_task = web_search_service.search(query)
        social_task = social_search_service.search(query)
        
        results = await asyncio.gather(web_task, social_task, return_exceptions=True)
        
        sources: List[Dict[str, Any]] = []
        
        # Add Serper Results (limited to 5 for balance)
        if not isinstance(results[0], Exception) and isinstance(results[0], dict):
            web_results = getattr(results[0], "get", lambda *a: [])("sources", [])[:5]  # type: ignore
            for s in web_results:
                # Normalize Serper results to match SocialSearchService format
                sources.append({
                    "title": s.get("title", ""),
                    "url": s.get("url", ""),
                    "platform": "web",
                    "snippet": s.get("snippet", ""),
                    "metadata": {},
                    "reliability_score": 60, # Baseline for web
                    "agreement_score": 0
                })
        else:
             logger.error(f"Web search error: {results[0]}")
             
        # Add Social Results
        if not isinstance(results[1], Exception) and isinstance(results[1], list):
             # Ensure limits: 5 YT, 5 HN, 3 Wiki
             social_results = results[1]
             sources.extend(social_results)  # type: ignore
        else:
             logger.error(f"Social search error: {results[1]}")
             
        # Compute agreement before returning
        self._compute_agreement_scores(sources)
        
        return sources

    async def _emit_final_synthesis(self, query: str, observation: str) -> AsyncIterator[Dict[str, Any]]:
        """
        Performs the final synthesis step, returning JSON containing answer, insights, and sources.
        """
        yield {"type": "thought", "content": "Synthesizing final research report with key insights..."}
        
        final_prompt = f"""
        Based on all the research gathered below, provide a comprehensive final answer to: "{query}"
        
        You must return a raw JSON object with this exact structure:
        {{
            "answer": "Detailed synthesized explanation with citations [1][2] referencing the source IDs.",
            "key_insights": [
                "Important insight 1",
                "Important insight 2",
                "Important insight 3"
            ],
            "sources": [
                {{
                    "id": 1,
                    "title": "Source Title",
                    "url": "https://example.com",
                    "platform": "web | youtube | hackernews | wikipedia",
                    "summary": "1-2 sentence explanation of what this source contributes.",
                    "reliability_score": 88
                }}
            ]
        }}
        
        Gathered Sources:
        {observation}
        
        Return ONLY valid JSON.
        """
        
        final_answer_json_str = await self.llm.generate([{"role": "user", "content": final_prompt}])
        
        try:
             # Clean up potential markdown formatting from LLM
             json_str = re.sub(r'```json\s*', '', final_answer_json_str)
             json_str = re.sub(r'\s*```', '', json_str)
             
             parsed_data = json.loads(json_str)
             
             # Stream insights if present
             if "key_insights" in parsed_data:
                 yield {"type": "insights", "data": parsed_data["key_insights"]}
                 
             # Stream the main answer
             if "answer" in parsed_data:
                 yield {"type": "answer", "content": parsed_data["answer"]}
             else:
                  yield {"type": "answer", "content": "Could not extract answer from synthesis."}
                  
             # We could optionally stream back the summarized sources here, 
             # but the frontend currently uses the 'sources' event emitted during the search phase.
             # If required by frontend, we could emit a special 'synthesized_sources' event.
             
        except Exception as e:
            logger.error(f"Failed to parse final synthesis JSON: {e}")
            logger.debug(f"Raw output: {final_answer_json_str}")
            # Fallback
            yield {"type": "answer", "content": "Synthesis completed, but format was invalid. Please check logs."}


    async def conduct_research(self, query: str, mode: str = "fast") -> AsyncIterator[Dict[str, Any]]:
        """
        Conducts research using the ReAct pattern and yields progression states.
        """
        logger.info(f"Starting {mode} research for: {query}")
        
        all_sources: List[Dict[str, Any]] = []
        messages = []
        
        # --- Part 1: Query Expansion (DEEP Mode Only) ---
        search_queries = [query]
        if mode == "deep":
            yield {"type": "thought", "content": "Expanding research scope with multiple queries..."}
            search_queries = await self.generate_search_queries(query)
            logger.info(f"Generated search queries: {search_queries}")

        # --- Part 2: Initial Information Gathering ---
        for q_idx, q in enumerate(search_queries):
            yield {"type": "thought", "content": f"Searching across Web, Wikipedia, HackerNews, YouTube, Reddit, Quora, arXiv & LinkedIn: {q} ({q_idx + 1}/{len(search_queries)})"}
            
            # Using new multi-source search
            sources = await self.execute_multi_source_search(q)
            logger.info(f"Retrieved {len(sources)} sources for query: {q}")
            
            new_sources = []
            for s in sources:
                if s["url"] not in [src["url"] for src in all_sources]:
                    # Add ID for citation tracking
                    s["id"] = len(all_sources) + 1
                    all_sources.append(s)
                    new_sources.append(s)
            
            if new_sources:
                yield {"type": "sources", "data": new_sources}

        # --- Part 3: ReAct Reasoning Loop ---
        max_iters = self.max_iterations.get(mode, 1)
        iterations = 0
        
        # Build initial context from all sources
        observation: str = "Initial Search Observations:\n"
        for s in all_sources:
            agreement_text = f"(Agrees with {s['agreement_score']} other sources)" if s['agreement_score'] > 0 else ""
            observation += f"Source [{s['id']}]: {s['title']} ({s['url']}) | Platform: {s['platform']} | Reliability: {s['reliability_score']}/100 {agreement_text}\nSnippet: {s.get('snippet', '')}\n\n"

        search_history = list(search_queries)
        
        system_prompt = f"""
You are the Campus AI Deep Research Architect. Your goal is to conduct an exhaustive, multi-perspective investigation into the user's query.

RESEARCH PROTOCOL:
- MANDATORY ITERATION: You must perform at least two separate search cycles before providing a 'Final Answer'.
- DIVERSIFIED QUERY GENERATION: Do not repeat search terms. For every new action, you must generate a query that explores a different 'angle' (e.g., definitions, statistics, historical context, criticisms, or expert opinions).
- SOCIAL MEDIA INTEGRATION: When conducting research, explicitly look for expert opinions, criticisms, and community discussions from social platforms. Use the `search` tool to gather perspectives that standard web snippets might miss (e.g., "expert opinions on [topic]" or "Reddit discussions on [topic]").
- PLATFORM PRIORITIZATION: Prioritize specific platforms based on query type (e.g., technical queries → HackerNews/StackOverflow; academic queries → arXiv; community sentiment → Reddit/Quora; professional insights → LinkedIn).
- QUERY MEMORY: Maintain an internal list of all previous search queries to ensure 0% redundancy.
- GAP ANALYSIS: After every 'Observation', you must explicitly state what information is still missing or what contradictions were found between sources.

YOUR OPERATING STRUCTURE:
1. **Thought**: Analyze the current context. Identify what we know and, more importantly, what we don't know yet.
2. **Previous Queries**: [List all queries used so far].
3. **Action**: Choose one: `search("new_diversified_query")` or `final_answer("synthesis")`.

CITATION RULES: Every factual claim in your Final Answer must include a numerical citation (e.g., [1], [2]) corresponding to the source index provided in the observations. You MUST formulate your Final Answer as a well-structured set of bullet points (pointwise). Do not write a single block of text.

CURRENT GOAL: Break the user's prompt into sub-components. Start by searching for the foundational aspects of the topic.
Query: {query}
"""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Here are the initial results for your research:\n{observation}\nPrevious queries used: {search_history}\nPlease provide your Thought, Previous Queries, and Action."}
        ]

        while iterations < max_iters:
            iterations += 1
            logger.info(f"Research iteration {iterations}/{max_iters}")
            
            llm_response = await self.llm.generate(messages)  # type: ignore
            logger.info(f"RAW LLM REACT RESPONSE:\n{llm_response}\n----------------")
            
            # 1. Thought Detection
            thought_match = re.search(r"Thought:\s*(.*?)(?=\n\s*(?:Action|Previous Queries|Answer|Final Answer):|$)", llm_response, re.DOTALL | re.IGNORECASE)
            thought = thought_match.group(1).strip() if thought_match else "Synthesizing research data..."
            yield {"type": "thought", "content": thought}

            # 2. Action Detection (Search or Synthesize)
            # More forgiving regex to handle markdown, missing quotes, or slight variations
            action_match = re.search(r"Action:\s*(?:`?\\?)?(final_answer|search)\s*\(\s*[\"']?(.*?)[\"']?\s*\)(?:`?\\?)?", llm_response, re.IGNORECASE)
            if action_match:
                full_action = action_match.group(1).lower()
                
                if "final_answer" in full_action:
                    async for event in self._emit_final_synthesis(query, observation):  # type: ignore
                        yield event
                    return
                else:
                    sub_query = action_match.group(2)
                    search_history.append(sub_query)
                    yield {"type": "thought", "content": f"Performing targeted search: {sub_query}"}
                    
                    sources = await self.execute_multi_source_search(sub_query)  # type: ignore
                    
                    new_sources = []
                    for s in sources:
                        if s["url"] not in [src["url"] for src in all_sources]:
                            s["id"] = len(all_sources) + 1
                            all_sources.append(s)  # type: ignore
                            new_sources.append(s)
                    
                    if new_sources:
                        yield {"type": "sources", "data": new_sources}

                    current_observation = "New Search Results:\n"
                    for s in sources:
                        # Find existing ID
                        existing_source = next((src for src in all_sources if src["url"] == s["url"]), None)
                        if existing_source:
                            agreement_text = f"(Agrees with {existing_source['agreement_score']} other sources)" if existing_source['agreement_score'] > 0 else ""
                            current_observation += f"Source [{existing_source['id']}]: {existing_source['title']} ({existing_source['url']}) | Platform: {existing_source['platform']} | Reliability: {existing_source['reliability_score']}/100 {agreement_text}\nSnippet: {existing_source.get('snippet', '')}\n\n"
                            
                    # Update global observation context for final synthesis
                    observation += current_observation  # type: ignore
                    
                    messages.append({"role": "assistant", "content": llm_response})
                    messages.append({"role": "user", "content": f"Observation: {current_observation}\nPrevious queries used: {search_history}\nPlease provide your next Thought, Previous Queries, and Action."})
            else:
                # If no clear action or answer, fallback to synthesis
                logger.warning("No clear Action or Answer detected. Falling back to synthesis.")
                break

        # --- Part 4: Final Synthesis (Fallback) ---
        async for event in self._emit_final_synthesis(query, observation):  # type: ignore
            yield event

research_service = ResearchService()
