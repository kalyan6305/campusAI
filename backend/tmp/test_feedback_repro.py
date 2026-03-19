import asyncio
import httpx
import json

async def test_feedback():
    url = "http://localhost:8000/api/v1/interview/feedback"
    # Note: We might need a JWT token if it's protected.
    # But usually locally we can bypass or get one.
    
    payload = {
        "role": "Software Developer",
        "company": "Generic",
        "question": "What is the time complexity of binary search?",
        "user_answer": "It is O(log n).",
        "round_type": "Technical",
        "expected_signals": ["O(log n)"],
        "follow_up_probes": ["Explain why it's O(log n)"],
        "hint_used": False
    }
    
    # We need a token. Let's try to login or get one from the db if possible.
    # Or just try to hit it and see the 401/500 error.
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, json=payload)
            print(f"Status: {resp.status_code}")
            print(f"Response: {resp.text}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_feedback())
