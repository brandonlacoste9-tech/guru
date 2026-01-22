import asyncio
import sys
import argparse
from browser_use import (
    Agent,
    ChatGoogle as ChatGoogleGenerativeAI,
    ChatAnthropic,
    ChatOpenAI,
)
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from the root .env
root_env = Path(__file__).resolve().parents[4] / ".env"
load_dotenv(dotenv_path=root_env)


async def main():
    parser = argparse.ArgumentParser(description="Run a browser-use agent.")
    parser.add_argument(
        "--task", type=str, required=True, help="The task for the agent."
    )
    parser.add_argument(
        "--provider",
        type=str,
        default="google",
        help="AI provider (google or anthropic).",
    )
    parser.add_argument("--model", type=str, help="Specific model name.")
    args = parser.parse_args()

    if args.provider == "google":
        llm = ChatGoogleGenerativeAI(model=args.model or "gemini-1.5-flash")
    elif args.provider == "deepseek":
        llm = ChatOpenAI(
            model=args.model or "deepseek-chat",
            openai_api_key=os.getenv("DEEPSEEK_API_KEY"),
            openai_api_base="https://api.deepseek.com/v1",
        )
    elif args.provider == "anthropic":
        llm = ChatAnthropic(model=args.model or "claude-3-5-sonnet-20240620")
    else:
        print(f"Error: Unsupported provider {args.provider}")
        sys.exit(1)

    agent = Agent(
        task=args.task,
        llm=llm,
    )

    result = await agent.run()
    print(result)


if __name__ == "__main__":
    asyncio.run(main())
