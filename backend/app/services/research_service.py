import asyncio
import json
import logging
import re
from typing import AsyncGenerator

from app.llm.factory import get_llm_provider
from app.services.web_search_service import web_search_service
from app.services.social_search_service import social_search_service

logger = logging.getLogger(__name__)

class ResearchService:
    def __init__(self):
        self.system_prompt = """### 🧠 ROLE: Research Synthesis Engine
You are the primary engine inside a Deep Research system. Your objective is to provide a deep, multi-perspective synthesis of the user's query using only the provided web and social search results.

### ⚙️ TASK:
1. Understand the Query: Identify intent (explanation/comparison/steps) and key concepts.
2. Process Sources: For EACH source [n], extract useful facts, ignore irrelevance, and remove duplicates.
3. Cross-Source Reasoning: Merge overlapping info, resolve conflicts (prefer detailed/consistent info), and fill missing gaps using combined context.
4. Synthesize Final Answer: Transform scattered data into ONE clean, intelligent expert response.

### 🧩 RULES:
- RELIABILITY: Use ONLY provided search results. Do not hallucinate.
- CITATION MANDATE: Every factual claim MUST include a numerical citation marker [n].
- DO NOT repeat same idea multiple times.
- DO NOT mention "sources say..." unless needed for citations.

### 📤 OUTPUT FORMAT:
You must strictly follow the ReAct protocol:
Thought: [Identify gaps or reason about next steps]
Action: search("query") -- OR -- Final Answer:

## Final Answer
[Your well-structured synthesized response using [n] citations]

## Key Points
- point 1
- point 2
...
"""

    async def stream_research(self, query: str, mode: str = "fast") -> AsyncGenerator[str, None]:
        llm = get_llm_provider()
        
        # Termination Protocol Constants
        MAX_SEARCHES = 3
        MIN_SEARCHES_DEEP = 2
        
        # mode='fast' => ~1-2 iterations, mode='deep' => strict 2-3 searches
        max_iterations = 2 if mode == "fast" else 5
        
        search_count = 0
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
            current_thought = ""

            try:
                # Concurrent Social Search on first iteration
                if iteration == 0:
                    yield json.dumps({"type": "thought", "content": "\n\n🚀 *Initiating multi-channel discovery...*\n"})
                    # Trigger social search concurrently
                    social_task = asyncio.create_task(social_search_service.search(query))
                    # We continue with the main flow but will wait for social results to yield them
                
                # Signal frontend that the LLM is thinking 
                yield json.dumps({"type": "thought", "content": f"\n\n🤔 *Agent Thinking (Iteration {iteration + 1})...*\n"})
                
                # Prepend termination instructions if max searches reached
                if search_count >= MAX_SEARCHES:
                    messages.append({
                        "role": "system", 
                        "content": "You have reached the maximum search limit (3). You MUST now provide the Final Answer based ONLY on existing observations. Do not call the search tool again."
                    })

                async for token in llm.stream(messages):
                    response_buffer += token
                    
                    if "Final Answer:" in response_buffer:
                        if not is_final_answer:
                            is_final_answer = True
                            # Extract what comes after Final Answer:
                            split_text = response_buffer.split("Final Answer:")
                            clean_token = split_text[-1] if len(split_text) > 1 else ""
                            if clean_token:
                                yield json.dumps({"type": "answer", "content": clean_token})
                        else:
                            yield json.dumps({"type": "answer", "content": token})
                    else:
                        yield json.dumps({"type": "thought", "content": token})
                
                # If first iteration, yield social results now if they are ready
                if iteration == 0:
                    try:
                        social_results = await social_task
                        if social_results:
                            # Update indices for social results to follow web results
                            for res in social_results:
                                res["index"] = source_counter
                                source_counter += 1
                            yield json.dumps({"type": "sources", "data": social_results})
                            yield json.dumps({"type": "thought", "content": f"\n*Injected {len(social_results)} social media discussions into context.*\n"})
                    except Exception as e:
                        logger.error(f"Social search failed: {e}")

            except Exception as e:
                logger.error(f"ResearchService streaming failed: {e}")
                yield json.dumps({"type": "answer", "content": f"\n\n**Error:** {e}"})
                break
                
            messages.append({"role": "assistant", "content": response_buffer})
            
            # PARSING & TERMINATION LOGIC
            if is_final_answer:
                # Enforce minimum searches for deep mode
                if mode == "deep" and search_count < MIN_SEARCHES_DEEP:
                    is_final_answer = False
                    messages.append({
                        "role": "user", 
                        "content": f"Wait! This is Deep Research. You have only performed {search_count} search(es). You MUST perform at least {MIN_SEARCHES_DEEP} unique searches to ensure depth before finalizing."
                    })
                    yield json.dumps({"type": "thought", "content": "\n\n⚠️ *Depth check failed. Forcing additional research...*\n"})
                    continue
                else:
                    break
                
            # Parse for search action
            search_match = re.search(
                r'Action:\s*(?:Search\[(.*?)\]|search\(\s*"(.*?)"\s*\))',
                response_buffer,
                re.IGNORECASE,
            )

            if search_match and search_count < MAX_SEARCHES:
                search_query = (search_match.group(1) or search_match.group(2) or "").strip()
                if search_query:
                    search_count += 1
                    previous_queries.append(search_query)

                yield json.dumps({"type": "thought", "content": f"\n\n🔍 *Executing Web Search ({search_count}/{MAX_SEARCHES}): {search_query}*\n"})
                
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
                                "link": s.get("link", ""),
                                "snippet": s.get("snippet", "")
                            }
                            # Wrap search result in clear numerical index as requested
                            obs_text += f"[{source_counter}] Title: {s.get('title')} | URL: {s.get('link')} | Snippet: {s.get('snippet')}\n"
                            source_objects.append(s_data)
                            source_counter += 1
                            
                        # Yield sources to frontend explicitly
                        yield json.dumps({"type": "sources", "data": source_objects})
                        yield json.dumps({"type": "thought", "content": f"\n*{len(source_objects)} results injected into context.*\n"})
                        
                    messages.append({
                        "role": "user",
                        "content": (
                            obs_text + "\n" +
                            f"Previous Queries: {previous_queries}\n"
                            "Identify Gaps → Search OR Provide Final Answer:"
                        ),
                    })
                except Exception as e:
                    logger.error(f"Search failed: {e}")
                    messages.append({"role": "user", "content": f"Observation: Search failed with error: {e}"})
            else:
                # If no valid action or max searches reached
                if not is_final_answer:
                    if int(iteration) >= int(max_iterations) - 1 or int(search_count) >= int(MAX_SEARCHES):
                        # TRIGGER FALLBACK SUMMARIZATION
                        yield json.dumps({"type": "thought", "content": "\n\n⌛ *Search limit reached. Forcing final synthesis...*\n"})
                        messages.append({
                            "role": "user", 
                            "content": "STRICT TERMINATION: You have reached the search limit. Provide your 'Final Answer:' now using [n] citations based on all previous observations."
                        })
                        
                        # One final attempt to get the answer
                        response_buffer = ""
                        is_final_answer = True # Force parsing as answer
                        async for token in llm.stream(messages):
                            response_buffer += token
                            # Stream everything as answer in fallback mode
                            yield json.dumps({"type": "answer", "content": token})
                        break
                    else:
                        messages.append({
                            "role": "user", 
                            "content": "Invalid format. You must provide either an Action: search(\"query\") or a Final Answer: [...]"
                        })

research_service = ResearchService()
