import asyncio
import httpx
import json


async def test_automation():
    url = "http://localhost:8001/execute"
    payload = {
        "task_description": "Go to google.com and search for 'FloGuru AI Agent'",
        "user_id": "test_user",
        "automation_id": "test_automation",
        "run_id": "test_run_123",
        "config": {},
        "headless": True,
        "llm_provider": "google",
    }

    print(f"🚀 Sending test automation request to {url}...")
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(url, json=payload)
            print(f"Status Code: {response.status_code}")
            print("Response:")
            print(json.dumps(response.json(), indent=2))

            if response.status_code == 200 and response.json().get("success"):
                print(
                    "\n✅ SMOKE TEST PASSED: Browser Agent successfully executed the task."
                )
            else:
                print("\n❌ SMOKE TEST FAILED: Check the logs above.")
    except Exception as e:
        print(f"\n❌ ERROR connecting to sidecar: {e}")


if __name__ == "__main__":
    asyncio.run(test_automation())
