
import httpx
import asyncio
import json
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

async def test_openrouter():
    api_key = os.getenv("OPENROUTER_API_KEY")
    model = os.getenv("LLM_MODEL")
    url = "https://openrouter.ai/api/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": "Say hello"}]
    }
    
    print(f"Testing model: {model}")
    print(f"URL: {url}")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload)
            print(f"Status Code: {response.status_code}")
            if response.status_code != 200:
                print(f"Error Body: {response.text}")
            else:
                data = response.json()
                print(f"Response: {data['choices'][0]['message']['content']}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_openrouter())
