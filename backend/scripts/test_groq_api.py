import httpx
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def test_groq():
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")
    url = "https://api.groq.com/openai/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": "Hello, are you working?"}],
        "stream": False
    }
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, json=payload, headers=headers)
            print(f"Status: {resp.status_code}")
            print(f"Response: {resp.text}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_groq())
