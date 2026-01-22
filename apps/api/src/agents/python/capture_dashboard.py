import asyncio
from playwright.async_api import async_playwright
import os


async def capture():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1280, "height": 800})

        # Navigate to the dashboard
        # Using a timeout because the server might still be building the page
        try:
            await page.goto(
                "http://localhost:3001/dashboard",
                wait_until="networkidle",
                timeout=30000,
            )
            # Give it a bit more time for animations to settle
            await asyncio.sleep(2)

            output_path = r"C:\Users\north\.gemini\antigravity\brain\5056d49a-7e54-48e2-9e93-69418baf00c5\dashboard_preview.png"
            await page.screenshot(path=output_path, full_page=False)
            print(f"Screenshot saved to {output_path}")
        except Exception as e:
            print(f"Error capturing screenshot: {e}")
        finally:
            await browser.close()


if __name__ == "__main__":
    asyncio.run(capture())
