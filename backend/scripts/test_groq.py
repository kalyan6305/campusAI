import asyncio
import os
import sys

# Ensure backend root is in path
backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_root)

from app.llm.factory import get_llm_provider
from app.llm.groq_provider import GroqProvider

async def test_groq():
    print("Testing Groq Provider integration...")
    try:
        provider = get_llm_provider()
        print(f"Active provider: {type(provider).__name__}")
        
        if not isinstance(provider, GroqProvider):
            print("ERROR: Provider is not GroqProvider!")
            return

        print("Sending test message: 'Hello, who are you?'")
        messages = [{"role": "user", "content": "Hello, who are you? Answer in 5 words."}]
        
        # Test generate
        print("\nTesting generate()...")
        response = await provider.generate(messages)
        print(f"Response: {response}")
        
        # Test stream
        print("\nTesting stream()...")
        print("Response: ", end="", flush=True)
        async for token in provider.stream(messages):
            print(token, end="", flush=True)
        print("\n")
        
        print("Groq integration verified successfully!")
    except Exception as e:
        print(f"\nVerification failed with error: {e}")

if __name__ == "__main__":
    asyncio.run(test_groq())
