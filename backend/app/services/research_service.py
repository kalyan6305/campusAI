import json
import logging
import re
from typing import AsyncGenerator

from app.llm.factory import get_llm_provider
from app.services.web_search_service import web_search_service

logger = logging.getLogger(__name__)

class ResearchService:
    def __init__(self):
        self.system_prompt = """You are the Campus AI Web Research Agent. Your goal is to investigate the user's query and provide a comprehensive answer.

You must strictly follow this ReAct format:
Thought: (Detail your reasoning, what you know, and what you are missing)
Action: Search[your explicit query here]
Observation: (Wait for the system to provide the search results)

You may perform multiple Search actions if needed. 
Once you have enough information, you MUST output your final answer formatted exactly as:
Final Answer: [your comprehensive response]

RULES:
- You must cite your sources in the Final Answer using [n] notation corresponding to the source index in your Observations.
- Do not make up information. Use the context provided.
"""

    async def stream_research(self, query: str, mode: str = "fast") -> AsyncGenerator[str, None]:
        llm = get_llm_provider()
        # Fast = max 2 iterations (1 search, 1 answer), Deep = max 5 iterations
        max_iterations = 2 if mode == "fast" else 5
        source_counter = 1
        
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": f"Query: {query}"}
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
            search_match = re.search(r'Action:\s*Search\[(.*?)\]', response_buffer, re.IGNORECASE)
            if search_match:
                search_query = search_match.group(1).strip()
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
                        
                    messages.append({"role": "user", "content": obs_text})
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
