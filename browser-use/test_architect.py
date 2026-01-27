import asyncio
import json
from python_bridge.browser_use_agent import execute


async def test():
    # Test 1: Env Var Read
    print("Test 1: Reading .env")
    payload = {
        "guru": "ARCHITECT",
        "task": "Read the .env file",
        "llm": "deepseek-v3",
        "use_cloud": False,
    }
    try:
        result = await execute(payload)
        print("Env Result:", json.dumps(result, indent=2))
    except Exception as e:
        print("Error:", str(e))

    # Test 2: Git Status
    print("\nTest 2: Git Operations")
    payload2 = {
        "guru": "ARCHITECT",
        "task": "Check git status",
        "llm": "deepseek-v3",
        "use_cloud": False,
    }
    try:
        result = await execute(payload2)
        print("Git Result:", json.dumps(result, indent=2))
    except Exception as e:
        print("Error:", str(e))


if __name__ == "__main__":
    asyncio.run(test())
