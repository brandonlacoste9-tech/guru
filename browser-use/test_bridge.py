import asyncio
import json
from python_bridge.browser_use_agent import execute


async def test():
    payload = {
        "guru": "TEST",
        "task": "Navigate to google.com and get the title",
        "llm": "deepseek-v3",
        "use_cloud": False,
    }
    print("Testing Python Bridge...")
    try:
        result = await execute(payload)
        print("Success:", json.dumps(result, indent=2))
    except Exception as e:
        print("Error:", str(e))


if __name__ == "__main__":
    asyncio.run(test())
