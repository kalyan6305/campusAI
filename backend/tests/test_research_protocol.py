import asyncio
import json
from unittest.mock import MagicMock, AsyncMock

# Mocking dependencies for testing the loop logic
import sys
from types import ModuleType

# Create mocks for app modules
mock_llm = MagicMock()
sys.modules["app.llm.factory"] = mock_llm

mock_web_instance = MagicMock()
mock_web_instance.search = AsyncMock()
mock_web = MagicMock(web_search_service=mock_web_instance)
sys.modules["app.services.web_search_service"] = mock_web

mock_social_instance = MagicMock()
mock_social_instance.search = AsyncMock()
mock_social = MagicMock(social_search_service=mock_social_instance)
sys.modules["app.services.social_search_service"] = mock_social

# Now we can safely import ResearchService
from app.services.research_service import ResearchService

async def async_iter(items):
    for item in items:
        yield item

async def test_deep_research_loop():
    print("--- Testing Deep Research Protocol ---")
    service = ResearchService()
    
    # Mock LLM to perform 1 search then try Final Answer (should be blocked)
    # Then perform another search then Final Answer (should be allowed)
    llm_mock = MagicMock()
    
    responses = [
        # Iteration 1: Agent wants to search
        ["Thought: Need info. Action: search(\"query1\")"],
        # Iteration 2: Agent tries to give Final Answer too early
        ["Thought: Done. Final Answer: Answer [1]"],
        # Iteration 3: Agent forced to search again
        ["Thought: Fine, more info. Action: search(\"query2\")"],
        # Iteration 4: Agent gives Final Answer (now search_count=2, should be allowed)
        ["Thought: Now done. Final Answer: Final Cited Answer [1] [2]"],
    ]
    
    def mock_stream(messages):
        return async_iter(responses.pop(0))

    llm_mock.stream = mock_stream
    mock_llm.get_llm_provider.return_value = llm_mock
    
    mock_web.web_search_service.search.return_value = {"results": [{"title": "T1", "link": "L1", "snippet": "S1"}]}
    mock_social.social_search_service.search.return_value = [{"title": "S1", "link": "SL1", "snippet": "SS1"}]

    print("Executing stream_research(mode='deep')...")
    iteration_count = 0
    search_count = 0
    final_answer_received = False
    depth_check_triggered = False

    async for chunk in service.stream_research(query="test", mode="deep"):
        # print(f"DEBUG CHUNK: {chunk}")
        data = json.loads(chunk)
        if data["type"] == "thought":
            print(f"THOUGHT: {data['content']}".strip())
            if "Depth check failed" in data["content"]:
                depth_check_triggered = True
        if data["type"] == "answer":
            print(f"ANSWER: {data['content']}".strip())
            final_answer_received = True

    print(f"Depth check triggered: {depth_check_triggered}")
    print(f"Final answer received: {final_answer_received}")
    
    assert depth_check_triggered, "Depth check should have been triggered for deep mode with < 2 searches"
    assert final_answer_received, "Final answer should have been produced eventually"
    print("✅ Deep Research Protocol Test Passed!")

async def test_fallback_synthesis():
    print("\n--- Testing Fallback Synthesis (Max Iterations) ---")
    service = ResearchService()
    llm_mock = MagicMock()
    
    # Simulate LLM always wanting to search, hitting limit
    responses = [
        ["Thought: Need more. Action: search(\"q1\")"],
        ["Thought: Need more. Action: search(\"q2\")"],
        ["Thought: Need more. Action: search(\"q3\")"],
        ["Stubborn LLM that forgot to say Final Answer: even though limit reached."],
        ["Final Fallback Answer using [1] [2] [3]"]
    ]
    
    def mock_stream(messages):
        return async_iter(responses.pop(0))

    llm_mock.stream = mock_stream
    mock_llm.get_llm_provider.return_value = llm_mock
    mock_web.web_search_service.search.return_value = {"results": [{"title": "T", "link": "L", "snippet": "S"}]}

    final_answer_received = False
    fallback_thought_received = False

    print("Starting stream_research loop...")
    try:
        async for chunk in service.stream_research(query="test", mode="deep"):
            print(f"RAW CHUNK: {chunk}")
            data = json.loads(chunk)
            if data["type"] == "thought":
                # print(f"THOUGHT: {data['content']}".strip())
                if "Search limit reached" in data.get("content", ""):
                    fallback_thought_received = True
            if data["type"] == "answer":
                # print(f"ANSWER: {data['content']}".strip())
                final_answer_received = True
    except Exception as e:
        print(f"ERROR IN LOOP: {e}")
        import traceback
        traceback.print_exc()

    print(f"Verification: Fallback thought: {fallback_thought_received}, Final answer: {final_answer_received}")

    print(f"Fallback thought received: {fallback_thought_received}")
    print(f"Final answer received: {final_answer_received}")
    
    assert fallback_thought_received, "Fallback thought should be received when search limit is reached"
    assert final_answer_received, "Final answer should be received from the fallback call"
    print("✅ Fallback Synthesis Test Passed!")

if __name__ == "__main__":
    print("ENTRY POINT")
    try:
        loop = asyncio.get_event_loop()
        loop.run_until_complete(test_deep_research_loop())
        loop.run_until_complete(test_fallback_synthesis())
    except Exception as e:
        print(f"FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
