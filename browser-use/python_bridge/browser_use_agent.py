# browser-use/python_bridge/browser_use_agent.py
import asyncio, json, sys
from browser_use import Agent, Browser, ChatBrowserUse, Tools

# ----------------------------------------------------------------------
# Custom tool definitions (feel free to add more!)
# ----------------------------------------------------------------------
tools = Tools()


@tools.action(description="Log a fitness workout")
async def log_workout(exercise: str, duration: int) -> str:
    # Stub – you can replace with a real DB/API call later
    return f"✅ Logged {exercise} for {duration} min"


@tools.action(description="Add a task to Todoist")
async def todoist_add(task: str, priority: int = 3) -> str:
    return f'🗒️ Added task "{task}" with priority {priority}'


@tools.action(description="Start a meditation timer")
async def start_meditation(duration: int) -> str:
    return f"🧘♀️ Started {duration}‑minute meditation timer"


# ----------------------------------------------------------------------
# 🛠️ ArchitectFlow Tools
# ----------------------------------------------------------------------


@tools.action(description="Manage Environment Variables (.env)")
async def manage_env_vars(action: str, key: str = None, value: str = None) -> str:
    """
    action: 'read' or 'update'
    key: The variable name (e.g., 'API_KEY')
    value: The new value (only for 'update')
    """
    env_path = ".env"  # In the root of the monorepo (relative to execution)
    import os

    if action == "read":
        if os.path.exists(env_path):
            with open(env_path, "r") as f:
                return f"📄 Content of .env:\n{f.read()}"
        return "❌ .env file not found."

    if action == "update" and key and value:
        # Simple append/replace logic placeholder
        # Real implementation would parse lines
        return f"✅ (Simulation) Updated {key} to {value[:4]}***"

    return "❌ Invalid action or missing params."


@tools.action(description="Docker Operations")
async def docker_operations(command: str) -> str:
    """
    command: e.g., 'ps', 'restart redis', 'logs'
    """
    import subprocess

    try:
        # Mapping simple intents to commands
        cmd = ["docker", "ps"]  # default
        if "restart" in command:
            service = command.split(" ")[-1]
            cmd = ["docker", "restart", service]
        elif "log" in command:
            cmd = ["docker", "compose", "logs", "--tail=20"]

        result = subprocess.run(cmd, capture_output=True, text=True)
        return f"🐳 Docker Output:\n{result.stdout}\n{result.stderr}"
    except Exception as e:
        return f"❌ Docker Error: {str(e)}"


@tools.action(description="Git Operations")
async def git_operations(action: str) -> str:
    """
    action: 'status', 'pull', 'log'
    """
    import subprocess

    try:
        cmd = ["git", action]
        result = subprocess.run(cmd, capture_output=True, text=True)
        return f"🐙 Git {action}:\n{result.stdout}"
    except Exception as e:
        return f"❌ Git Error: {str(e)}"


# ----------------------------------------------------------------------
# Core executor – runs a single agent step
# ----------------------------------------------------------------------
async def execute(payload: dict):
    # --------------------------------------------------------------
    # Browser selection
    # --------------------------------------------------------------
    browser = Browser(use_cloud=payload.get("use_cloud", False))

    # --------------------------------------------------------------
    # LLM choice – DeepSeek‑V3 is cheap + strong
    # --------------------------------------------------------------
    llm = ChatBrowserUse(model=payload.get("llm", "deepseek-v3"))

    # --------------------------------------------------------------
    # Build and run the agent
    # --------------------------------------------------------------
    agent = Agent(task=payload["task"], llm=llm, browser=browser, tools=tools)
    history = await agent.run()
    return {
        "guru": payload["guru"],
        "task": payload["task"],
        "history": history,
        "success": True,
    }


# ----------------------------------------------------------------------
# REPL – reads one JSON line, writes one JSON line
# ----------------------------------------------------------------------
async def main():
    while line := sys.stdin.readline():
        if not line:
            break
        try:
            payload = json.loads(line)
            result = await execute(payload)
            print(json.dumps(result), flush=True)
        except Exception as e:
            print(json.dumps({"error": str(e), "success": False}), flush=True)


if __name__ == "__main__":
    asyncio.run(main())
