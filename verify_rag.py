
import asyncio
import sys
import os

# Add the current directory to sys.path
sys.path.append(os.getcwd())

async def test():
    try:
        from app.rag import rag_service
        print(f"Import successful from: {rag_service.__file__}")
        
        # Test the module level function
        result = await rag_service.query_knowledge_by_regulation("test query")
        print(f"Call successful: {type(result)}")
        
        # Test if name is defined in chat_service
        from app.services import chat_service
        print("Chat service import successful")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
