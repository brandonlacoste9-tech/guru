#!/usr/bin/env python3
"""
FloGuru Antigravity Browser - Direct browser-use integration
Executes browser automation tasks using ChatBrowserUse (optimized)
"""

import asyncio
import sys
import json
import os
from typing import Dict, Any
from dotenv import load_dotenv


class AntigravityBrowser:
    """Browser automation powered by browser-use library"""

    def __init__(self):
        self.browser = None
        self.llm = None
        self.provider = "browser-use"  # default

    def _init_llm(self, provider: str = "browser-use"):
        """Initialize LLM based on provider"""
        self.provider = provider
        print(f"🔍 DEBUG: [LLM] Initializing provider: {provider}", file=sys.stderr)

        # Search for .env
        env_paths = [
            os.path.join(os.path.dirname(__file__), "../../.env"),
            os.path.join(os.getcwd(), ".env"),
        ]
        for p in env_paths:
            if os.path.exists(p):
                load_dotenv(p)
                break

        try:
            if provider == "browser-use":
                from browser_use import ChatBrowserUse

                self.llm = ChatBrowserUse()
            elif provider == "deepseek":
                from langchain_openai import ChatOpenAI

                self.llm = ChatOpenAI(
                    model="deepseek-chat",
                    api_key=os.getenv("DEEPSEEK_API_KEY"),
                    base_url="https://api.deepseek.com",
                )
            elif provider == "google":
                from langchain_google_genai import ChatGoogleGenerativeAI

                self.llm = ChatGoogleGenerativeAI(
                    model="gemini-1.5-flash",
                    google_api_key=os.getenv("GOOGLE_AI_API_KEY"),
                )
            else:
                raise ValueError(f"Unknown provider: {provider}")

            print(f"✅ {provider} LLM instantiated", file=sys.stderr)
        except Exception as e:
            print(f"❌ ERROR: LLM init failed for {provider}: {e}", file=sys.stderr)
            raise

    async def execute_task(
        self,
        task: str,
        max_steps: int = 10,
        headless: bool = True,
        provider: str = "browser-use",
    ) -> Dict[str, Any]:
        """
        Execute a browser automation task
        """
        try:
            print(
                f"🔍 DEBUG: [Task] Executing with provider={provider}",
                file=sys.stderr,
            )
            if not self.llm:
                self._init_llm(provider)

            print("🔍 DEBUG: Importing Browser...", file=sys.stderr)
            from browser_use import Browser

            print("🔍 DEBUG: [Browser] Launching...", file=sys.stderr)
            self.browser = Browser(headless=headless)

            print("🔍 DEBUG: Importing Agent...", file=sys.stderr)
            from browser_use import Agent

            print(
                f"🔍 DEBUG: [Agent] Creating mission: {task[:50]}...", file=sys.stderr
            )
            agent = Agent(task=task, llm=self.llm, browser=self.browser)

            print("🔍 DEBUG: Starting agent.run()...", file=sys.stderr)
            history = await agent.run(max_steps=max_steps)
            print("✅ Agent run completed", file=sys.stderr)

            result = {
                "success": True,
                "task": task,
                "provider": provider,
                "steps_taken": len(getattr(history, "action_names", lambda: [])()),
                "urls_visited": getattr(history, "urls", lambda: [])(),
                "final_result": getattr(history, "final_result", lambda: None)(),
                "extracted_content": getattr(
                    history, "extracted_content", lambda: []
                )(),
                "errors": [
                    str(e)
                    for e in getattr(history, "errors", lambda: [])()
                    if e is not None
                ],
                "action_names": getattr(history, "action_names", lambda: [])(),
            }
            return result

        except Exception as e:
            import traceback

            error_trace = traceback.format_exc()
            print(f"❌ ERROR: {error_trace}", file=sys.stderr)
            return {
                "success": False,
                "task": task,
                "provider": provider,
                "error": str(e),
                "error_type": type(e).__name__,
                "traceback": error_trace,
            }

        finally:
            if self.browser:
                try:
                    print("🔍 DEBUG: Closing browser...", file=sys.stderr)
                    if hasattr(self.browser, "stop"):
                        await self.browser.stop()
                    elif hasattr(self.browser, "close"):
                        await self.browser.close()
                except Exception as e:
                    print(f"🔍 DEBUG: Cleanup failed: {e}", file=sys.stderr)


async def main():
    """CLI entry point"""
    print("🔍 DEBUG: Starting Python script...", file=sys.stderr)
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No task provided"}))
        sys.exit(1)

    task = sys.argv[1]
    max_steps = 10
    headless = True
    provider = "browser-use"

    i = 2
    while i < len(sys.argv):
        if sys.argv[i] == "--max-steps" and i + 1 < len(sys.argv):
            max_steps = int(sys.argv[i + 1])
            i += 2
        elif sys.argv[i] == "--headless" and i + 1 < len(sys.argv):
            headless = sys.argv[i + 1].lower() == "true"
            i += 2
        elif sys.argv[i] == "--provider" and i + 1 < len(sys.argv):
            provider = sys.argv[i + 1]
            i += 2
        else:
            i += 1

    browser_executor = AntigravityBrowser()
    result = await browser_executor.execute_task(
        task=task, max_steps=max_steps, headless=headless, provider=provider
    )
    print(json.dumps(result))


if __name__ == "__main__":
    asyncio.run(main())
