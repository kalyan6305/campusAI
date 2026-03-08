import asyncio
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.environ["GEMINI_API_KEY"])

async def main():
    try:
        model = genai.GenerativeModel("gemma-3-27b-it")
        print("Model loaded")
        response = await model.generate_content_async([{"role": "user", "parts": [{"text": "Hello"}]}], stream=True)
        print("Response object created")
        async for chunk in response:
            print("Received chunk")
            try:
                print(chunk.text)
            except Exception as e:
                print(f"Inner Exception type: {type(e)}")
                print(f"Inner Exception message: {str(e)}")
    except Exception as e:
        print(f"Outer error: {type(e)}")
        print(f"Outer msg: {str(e)}")

asyncio.run(main())
