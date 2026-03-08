
import httpx
import asyncio
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

async def list_models():
    api_key = os.getenv("OPENROUTER_API_KEY")
    url = "https://openrouter.ai/api/v1/models"
    
    headers = {
        "Authorization": f"Bearer {api_key}"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            print(f"Status Code: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"Total models: {len(data.get('data', []))}")
                # Print first 5
                for m in data.get('data', [])[:5]:
                    print(f"- {m['id']}")
            else:
                print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    asyncio.run(list_models())
