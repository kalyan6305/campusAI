import json
import logging
import re
from typing import AsyncGenerator

from app.llm.factory import get_llm_provider
from app.services.web_search_service import web_search_service

logger = logging.getLogger(__name__)

class ResearchService:
    def __init__(self):
        self.system_prompt = """You are the Campus AI Research Architect. Your objective is to provide a deep, multi-perspective synthesis of the user's query using only the provided web and social search results.

GROUNDING MANDATE: You must generate your response based ONLY on the provided search results in the Observation block.

CITATION RULE: Every factual statement or synthesis must be immediately followed by a numerical citation (e.g., [n]) corresponding to the index of the source in the provided search results.

LINK INTEGRATION: Do not write out full URLs. Use the numerical index (e.g., [n]) which allows the system to link the text to the source in the sidebar.

You must strictly follow this format:
Thought: (Analyze what you know and what you are missing; identify gaps before final answer)
Previous Queries: [list all queries used so far]
Action: search("optimized_query")  OR  Final Answer: "cited_synthesis"

After each search action, the system will provide an Observation block containing search results indexed [1], [2], etc.

GAP ANALYSIS: Before your Final Answer, perform a Thought step that identifies what information was missing from the previous searches to ensure the research is Deep rather than Fast.

RULES:
- Do not make up information. Use only what is in the Observation blocks.
- In your Final Answer, cite sources with [n] matching the Observation index.
- Do not include full URLs; use citation indices only.
"""

    async def stream_research(self, query: str, mode: str = "fast") -> AsyncGenerator[str, None]:
        llm = get_llm_provider()
        # Fast = max 2 iterations (1 search, 1 answer), Deep = max 5 iterations
        max_iterations = 2 if mode == "fast" else 5
        source_counter = 1
        previous_queries = [query]

        messages = [
            {"role": "system", "content": self.system_prompt},
            {
                "role": "user",
                "content": (
                    f"Query: {query}\n"
                    f"Previous Queries: {previous_queries}"
                ),
            },
        ]

        for iteration in range(max_iterations):
            is_final_answer = False
            response_buffer = ""

            try:
                # Signal frontend that the LLM is thinking 
                yield json.dumps({"type": "thought", "content": "\n\n🤔 *Agent is thinking...*\n"})
                
                async for token in llm.stream(messages):
                    response_buffer += token
                    
                    if "Final Answer:" in response_buffer:
                        if not is_final_answer:
                            is_final_answer = True
                            # Extract what comes after Final Answer:
                            split_text = response_buffer.split("Final Answer:")
                            clean_token = split_text[-1] if len(split_text) > 1 else token
                            if clean_token:
                                yield json.dumps({"type": "answer", "content": clean_token})
                        else:
                            yield json.dumps({"type": "answer", "content": token})
                    else:
                        yield json.dumps({"type": "thought", "content": token})
            except Exception as e:
                logger.error(f"ResearchService streaming failed: {e}")
                yield json.dumps({"type": "answer", "content": f"\n\n**Error:** {e}"})
                break
                
            messages.append({"role": "assistant", "content": response_buffer})
            
            if is_final_answer:
                break
                
            # Parse for search action
            search_match = re.search(
                r'Action:\s*(?:Search\[(.*?)\]|search\(\s*"(.*?)"\s*\))',
                response_buffer,
                re.IGNORECASE,
            )

            if search_match:
                search_query = (search_match.group(1) or search_match.group(2) or "").strip()
                if search_query:
                    previous_queries.append(search_query)

                yield json.dumps({"type": "thought", "content": f"\n\n🔍 *Executing Web Search for: {search_query}*\n"})
                
                try:
                    search_data = await web_search_service.search(search_query)
                    new_sources = search_data.get("results", [])[:5]
                    
                    obs_text = f"Observation for '{search_query}':\n"
                    if not new_sources:
                        obs_text += "No results found.\n"
                        yield json.dumps({"type": "thought", "content": "\n*No results found.*\n"})
                    else:
                        source_objects = []
                        for s in new_sources:
                            s_data = {
                                "index": source_counter,
                                "title": s.get("title", ""),
                                "source": s.get("source", ""),
                                "link": s.get("link", "")
                            }
                            obs_text += f"[{source_counter}] {s.get('title')} ({s.get('source')}): {s.get('snippet')}\n"
                            source_objects.append(s_data)
                            source_counter += 1
                            
                        # Yield sources to frontend explicitly
                        yield json.dumps({"type": "sources", "data": source_objects})
                        yield json.dumps({"type": "thought", "content": f"\n*{len(source_objects)} results injected into context.*\n"})
                        
                    # Include list of previous queries to support the agent's requirement
                    messages.append({
                        "role": "user",
                        "content": (
                            obs_text + "\n" +
                            f"Previous Queries: {previous_queries}\n"
                        ),
                    })
                except Exception as e:
                    logger.error(f"Search failed: {e}")
                    messages.append({"role": "user", "content": f"Observation: Search failed with error: {e}"})
            else:
                # Force final answer if no valid action provided and out of iterations
                if iteration == max_iterations - 2:
                    messages.append({"role": "user", "content": "You are running out of time. You MUST provide your Final Answer: [...] now."})
                else:
                    messages.append({"role": "user", "content": "Invalid format. You must provide either an Action: Search[...] or a Final Answer: [...]"})

research_service = ResearchService()
