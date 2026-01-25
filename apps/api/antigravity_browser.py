#!/usr/bin/env python3
"""
FloGuru Antigravity Browser vNext - Advanced browser-use integration
Implements Stealth, Sandboxing, Structured Output, and ChatBrowserUse optimizations.
"""

import asyncio
import sys
import json
import os
import argparse
import uuid
import traceback
from pathlib import Path
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

if sys.platform == "win32":
    sys.stderr.reconfigure(encoding="utf-8")
    sys.stdout.reconfigure(encoding="utf-8")


class AntigravityBrowser:
    """Enhanced Browser automation powered by browser-use vNext"""

    def __init__(self, use_vnext: bool = True):
        self.browser = None
        self.llm = None
        self.provider = "browser-use" if use_vnext else "google"
        self.use_vnext = use_vnext

    def _init_llm(self, provider: str = "browser-use"):
        """Initialize LLM based on provider with vNext optimizations"""
        self.provider = provider
        print(
            f"🔍 DEBUG: [LLM] Initializing vNext provider: {provider}", file=sys.stderr
        )

        # Search for .env
        env_paths = [
            os.path.join(os.path.dirname(__file__), "../../.env"),
            os.path.join(os.getcwd(), ".env"),
            os.path.join(Path.home(), ".env"),
        ]
        for p in env_paths:
            if os.path.exists(p):
                load_dotenv(p)
                break

        try:
            if provider == "browser-use":
                # vNext: Optimized ChatBrowserUse
                try:
                    from browser_use import ChatBrowserUse

                    self.llm = ChatBrowserUse()
                    print("✅ ChatBrowserUse (vNext) instantiated", file=sys.stderr)
                except ImportError:
                    print(
                        "⚠️ ChatBrowserUse not found, falling back to ChatOpenAI",
                        file=sys.stderr,
                    )
                    from browser_use.llm.openai.chat import ChatOpenAI

                    self.llm = ChatOpenAI(model="gpt-4o")

            elif provider == "deepseek":
                from browser_use.llm.openai.chat import ChatOpenAI

                self.llm = ChatOpenAI(
                    model="deepseek-chat",
                    api_key=os.getenv("DEEPSEEK_API_KEY"),
                    base_url="https://api.deepseek.com",
                )
            elif provider == "google":
                from browser_use.llm.google.chat import ChatGoogle

                self.llm = ChatGoogle(
                    model="gemini-1.5-flash",
                    api_key=os.getenv("GOOGLE_AI_API_KEY"),
                )
            else:
                from browser_use.llm.openai.chat import ChatOpenAI

                self.llm = ChatOpenAI(model=provider if "gpt" in provider else "gpt-4o")

        except Exception as e:
            print(f"❌ ERROR: LLM init failed for {provider}: {e}", file=sys.stderr)
            raise

    async def execute_task(
        self,
        task: str,
        max_steps: int = 30,
        headless: bool = True,
        provider: str = "browser-use",
        enable_stealth: bool = True,
        sandbox: bool = False,
        record_video: bool = False,
        profile_name: str = None,
        run_id: str = None,
    ) -> Dict[str, Any]:
        """
        Execute a mission with vNext capabilities (Stealth, Sandbox, Video)
        """
        run_id = run_id or str(uuid.uuid4())
        script_dir = Path(__file__).parent.absolute()
        temp_dir = script_dir / "temp" / run_id
        profile_dir = script_dir / "profiles" / profile_name if profile_name else None

        screenshots: List[str] = []

        try:
            print(
                f"🚀 vNext Mission Start: {run_id} | Provider: {provider}",
                file=sys.stderr,
            )
            if not self.llm:
                self._init_llm(provider)

            from browser_use import BrowserProfile, Agent
            from browser_use import BrowserSession as Browser

            # vNext: Enhanced BrowserProfile with Stealth, Sandboxing, and Recording
            profile = BrowserProfile(
                headless=headless,
                disable_security=False,  # Maintain security by default
                allowed_domains=None,  # Open by default, controlled by mission
            )

            if record_video:
                print(
                    f"🎬 GVR Enabled: Recording mission to {temp_dir}", file=sys.stderr
                )
                temp_dir.mkdir(parents=True, exist_ok=True)
                # vNext uses record_video_dir and is a Path object
                profile.record_video_dir = temp_dir
                # profile.record_video_format = "mp4" # Removed: Not in vNext schema
                profile.record_video_framerate = 10

            if enable_stealth:
                print(
                    "🛡️ Stealth Enabled: Masking automation fingerprints",
                    file=sys.stderr,
                )
                # vNext handles this internally in BrowserProfile via CHROME_DISABLED_COMPONENTS

            if sandbox:
                print("📦 Sandbox Enabled: Isolating session data", file=sys.stderr)
                temp_data_dir = temp_dir / "browser_data"
                temp_data_dir.mkdir(parents=True, exist_ok=True)
                profile.user_data_dir = str(temp_data_dir)

            self.browser = Browser(browser_profile=profile)

            print("🧠 Creating vNext Agent...", file=sys.stderr)
            agent = Agent(
                task=task,
                llm=self.llm,
                browser=self.browser,
                use_vision=True,  # vNext standard
            )

            print("🏃 Execution in progress...", file=sys.stderr)
            history = await agent.run(max_steps=max_steps)
            print("✅ Mission complete", file=sys.stderr)

            # Media Processing
            video_path = None
            if record_video:
                # Find the generated mp4 file
                mp4_files = list(temp_dir.glob("*.mp4"))
                if mp4_files:
                    video_path = str(mp4_files[0])
                    print(f"📹 Video recorded: {video_path}", file=sys.stderr)

            # Capture final state screenshot always for audit
            temp_dir.mkdir(parents=True, exist_ok=True)
            try:
                session = await self.browser.get_current_session()
                if session:
                    final_path = temp_dir / "final_state.png"
                    page = await session.get_current_page()
                    await page.screenshot(path=str(final_path))
                    screenshots.append(f"temp/{run_id}/final_state.png")
            except Exception as ss_err:
                print(f"⚠️ Media capture failed: {ss_err}", file=sys.stderr)

            # Generate structured result
            final_result = getattr(history, "final_result", lambda: "Task complete")()

            return {
                "success": True,
                "task": task,
                "provider": provider,
                "run_id": run_id,
                "steps_taken": (
                    len(history.history) if hasattr(history, "history") else 0
                ),
                "urls_visited": history.urls() if hasattr(history, "urls") else [],
                "final_result": final_result,
                "extracted_content": (
                    history.extracted_content()
                    if hasattr(history, "extracted_content")
                    else []
                ),
                "screenshots": screenshots,
                "video_path": video_path,
                "errors": (
                    [str(e) for e in history.errors() if e]
                    if hasattr(history, "errors")
                    else []
                ),
            }

        except Exception as e:
            error_trace = traceback.format_exc()
            print(f"💀 CRITICAL FAILURE: {error_trace}", file=sys.stderr)
            return {
                "success": False,
                "task": task,
                "provider": provider,
                "run_id": run_id,
                "error": str(e),
                "error_type": type(e).__name__,
                "traceback": error_trace,
            }

        finally:
            if self.browser:
                try:
                    print("🧹 Cleanup: Closing browser...", file=sys.stderr)
                    await self.browser.close()
                except Exception as e:
                    print(f"⚠️ Cleanup failed: {e}", file=sys.stderr)


async def main():
    """CLI entry point for vNext Bridge"""
    parser = argparse.ArgumentParser(description="FloGuru Antigravity Browser vNext")
    parser.add_argument("task", help="Web automation task description")
    parser.add_argument("--max-steps", type=int, default=30)
    parser.add_argument("--headless", type=str, default="true")
    parser.add_argument("--provider", default="browser-use")
    parser.add_argument("--enable-stealth", action="store_true", default=True)
    parser.add_argument("--sandbox", action="store_true", default=False)
    parser.add_argument("--record-video", action="store_true", default=False)
    parser.add_argument("--profile-name", help="Named browser profile")
    parser.add_argument("--run-id", help="Correlation ID")

    args = parser.parse_args()
    headless = args.headless.lower() == "true"

    browser_executor = AntigravityBrowser(use_vnext=True)
    result = await browser_executor.execute_task(
        task=args.task,
        max_steps=args.max_steps,
        headless=headless,
        provider=args.provider,
        enable_stealth=args.enable_stealth,
        sandbox=args.sandbox,
        record_video=args.record_video,
        profile_name=args.profile_name,
        run_id=args.run_id,
    )
    print(json.dumps(result))


if __name__ == "__main__":
    asyncio.run(main())
