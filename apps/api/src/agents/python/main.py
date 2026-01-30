from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import os
import asyncio
import logging
from dotenv import load_dotenv
from pathlib import Path
import uuid

# Load environment variables from the root .env
root_env = Path(__file__).resolve().parents[4] / ".env"
load_dotenv(dotenv_path=root_env)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger(__name__)

# browser-use imports
# Note: Adjusting imports based on actual library structure
try:
    from browser_use import (
        Agent,
        Browser,
        ChatGoogle as ChatGoogleGenerativeAI,
        ChatAnthropic,
        ChatOpenAI,
    )

    # Some specialized versions might have ChatBrowserUse, fallback to regular LLMs
    try:
        from browser_use import ChatBrowserUse
    except ImportError:
        ChatBrowserUse = None
except ImportError:
    Agent = None
    Browser = None


app = FastAPI(
    title="FloGuru Browser Automation Service",
    description="AI-powered browser automation for FloGuru",
    version="1.0.0",
)

# CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# REQUEST/RESPONSE MODELS
# ============================================


class ExecuteRequest(BaseModel):
    task_description: str
    user_id: str
    automation_id: str
    run_id: str
    config: Dict[str, Any] = {}
    headless: bool = True
    use_cloud: bool = False
    llm_provider: str = "google"
    llm_model: Optional[str] = None


class ActionLog(BaseModel):
    step: int
    action: str
    result: str
    timestamp: str
    screenshot: Optional[str] = None
    error: Optional[str] = None


class ExecuteResponse(BaseModel):
    success: bool
    run_id: str
    history: List[ActionLog] = []
    duration_ms: int
    started_at: str
    completed_at: str
    error: Optional[str] = None


# ============================================
# SESSION REGISTRY
# ============================================

class SessionInfo:
    """Information about a browser session."""
    def __init__(self, session_id: str, browser: Browser, agent: Agent, headless: bool, created_at: datetime):
        self.session_id = session_id
        self.browser = browser
        self.agent = agent
        self.headless = headless
        self.created_at = created_at
        self.last_activity = datetime.utcnow()
        self.task_count = 0

class SessionRegistry:
    """Registry of active browser sessions with persistence."""
    
    def __init__(self):
        self._sessions: Dict[str, SessionInfo] = {}
        self._lock = asyncio.Lock()
        # Session timeout: 30 minutes of inactivity
        self.session_timeout_seconds = 30 * 60
        
    async def get_or_create(
        self,
        session_id: Optional[str] = None,
        headless: bool = True,
        llm_provider: str = "google",
        llm_model: Optional[str] = None,
    ) -> SessionInfo:
        """Get existing session or create new one."""
        async with self._lock:
            # Generate session ID if not provided
            if not session_id:
                session_id = str(uuid.uuid4())
            
            # Check if session exists and is still valid
            if session_id in self._sessions:
                session = self._sessions[session_id]
                # Check if session has expired
                time_since_activity = (datetime.utcnow() - session.last_activity).total_seconds()
                if time_since_activity > self.session_timeout_seconds:
                    logger.info(f"Session {session_id} expired, closing...")
                    await self.close_session(session_id)
                else:
                    session.last_activity = datetime.utcnow()
                    logger.info(f"Reusing existing session {session_id}")
                    return session
            
            # Create new session
            logger.info(f"Creating new browser session: {session_id} (headless={headless})")
            
            if not Agent:
                raise HTTPException(status_code=500, detail="browser-use library not installed")
            
            llm = get_llm(llm_provider, llm_model)
            browser = Browser(headless=headless)
            agent = Agent(task="", llm=llm, browser=browser)
            
            session_info = SessionInfo(
                session_id=session_id,
                browser=browser,
                agent=agent,
                headless=headless,
                created_at=datetime.utcnow()
            )
            
            self._sessions[session_id] = session_info
            return session_info
    
    async def get(self, session_id: str) -> Optional[SessionInfo]:
        """Get session by ID."""
        async with self._lock:
            return self._sessions.get(session_id)
    
    async def close_session(self, session_id: str) -> bool:
        """Close and remove a session."""
        async with self._lock:
            if session_id not in self._sessions:
                return False
            
            session = self._sessions.pop(session_id)
            logger.info(f"Closing session {session_id}")
            try:
                # Clean up browser resources
                if hasattr(session.browser, 'close'):
                    await session.browser.close()
            except Exception as e:
                logger.warning(f"Error closing session {session_id}: {e}")
            return True
    
    async def close_all(self):
        """Close all sessions."""
        async with self._lock:
            session_ids = list(self._sessions.keys())
            for session_id in session_ids:
                await self.close_session(session_id)
    
    def list_sessions(self) -> List[Dict[str, Any]]:
        """List all active sessions."""
        return [
            {
                "session_id": s.session_id,
                "headless": s.headless,
                "created_at": s.created_at.isoformat(),
                "last_activity": s.last_activity.isoformat(),
                "task_count": s.task_count,
            }
            for s in self._sessions.values()
        ]

# Global session registry
session_registry = SessionRegistry()

# ============================================
# CORE LOGIC
# ============================================


def get_llm(provider: str, model: Optional[str]):
    if provider == "google":
        # Google AI Studio (Gemini)
        return ChatGoogleGenerativeAI(model=model or "gemini-1.5-flash")
    elif provider == "deepseek":
        # DeepSeek via OpenAI-compatible API
        return ChatOpenAI(
            model=model or "deepseek-chat",
            openai_api_key=os.getenv("DEEPSEEK_API_KEY"),
            openai_api_base="https://api.deepseek.com/v1",
        )
    elif provider == "anthropic":
        return ChatAnthropic(model=model or "claude-3-5-sonnet-20240620")
    elif provider == "openai":
        return ChatOpenAI(model=model or "gpt-4o-mini")
    elif provider == "browser-use" and ChatBrowserUse:
        return ChatBrowserUse()
    else:
        # Fallback to Gemini (AI Studio)
        return ChatGoogleGenerativeAI(model="gemini-1.5-flash")


@app.post("/execute", response_model=ExecuteResponse)
async def execute_task(request: ExecuteRequest):
    """Execute a task - creates new browser instance (legacy endpoint)."""
    start_time = datetime.utcnow()

    if not Agent:
        raise HTTPException(status_code=500, detail="browser-use library not installed")

    llm = get_llm(request.llm_provider, request.llm_model)
    browser = Browser(headless=request.headless)
    agent = Agent(task=request.task_description, llm=llm, browser=browser)

    try:
        history = await agent.run()

        # Process history
        history_logs = []
        for idx, step in enumerate(history):
            history_logs.append(
                ActionLog(
                    step=idx + 1,
                    action=str(getattr(step, "action", "task")),
                    result="success",
                    timestamp=datetime.utcnow().isoformat(),
                )
            )

        end_time = datetime.utcnow()
        return ExecuteResponse(
            success=True,
            run_id=request.run_id,
            history=history_logs,
            duration_ms=int((end_time - start_time).total_seconds() * 1000),
            started_at=start_time.isoformat(),
            completed_at=end_time.isoformat(),
        )
    except Exception as e:
        end_time = datetime.utcnow()
        return ExecuteResponse(
            success=False,
            run_id=request.run_id,
            error=str(e),
            duration_ms=int((end_time - start_time).total_seconds() * 1000),
            started_at=start_time.isoformat(),
            completed_at=end_time.isoformat(),
        )


# ============================================
# SESSION-BASED ENDPOINTS
# ============================================

class SessionExecuteRequest(BaseModel):
    task_description: str
    session_id: Optional[str] = None
    headless: bool = True
    llm_provider: str = "google"
    llm_model: Optional[str] = None
    run_id: Optional[str] = None


@app.post("/sessions/create")
async def create_session(
    headless: bool = True,
    llm_provider: str = "google",
    llm_model: Optional[str] = None,
):
    """Create a new persistent browser session."""
    try:
        session = await session_registry.get_or_create(
            headless=headless,
            llm_provider=llm_provider,
            llm_model=llm_model,
        )
        return {
            "success": True,
            "session_id": session.session_id,
            "created_at": session.created_at.isoformat(),
        }
    except Exception as e:
        logger.error(f"Error creating session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/sessions/{session_id}/execute", response_model=ExecuteResponse)
async def execute_with_session(session_id: str, request: SessionExecuteRequest):
    """Execute a task using an existing session (persistent browser)."""
    start_time = datetime.utcnow()
    
    # Get or create session
    session = await session_registry.get_or_create(
        session_id=session_id,
        headless=request.headless,
        llm_provider=request.llm_provider,
        llm_model=request.llm_model,
    )
    
    session.task_count += 1
    session.last_activity = datetime.utcnow()
    
    # Update agent task
    session.agent.task = request.task_description
    
    try:
        history = await session.agent.run()
        
        # Process history
        history_logs = []
        for idx, step in enumerate(history):
            history_logs.append(
                ActionLog(
                    step=idx + 1,
                    action=str(getattr(step, "action", "task")),
                    result="success",
                    timestamp=datetime.utcnow().isoformat(),
                )
            )
        
        end_time = datetime.utcnow()
        return ExecuteResponse(
            success=True,
            run_id=request.run_id or session_id,
            history=history_logs,
            duration_ms=int((end_time - start_time).total_seconds() * 1000),
            started_at=start_time.isoformat(),
            completed_at=end_time.isoformat(),
        )
    except Exception as e:
        logger.error(f"Error executing task in session {session_id}: {e}")
        end_time = datetime.utcnow()
        return ExecuteResponse(
            success=False,
            run_id=request.run_id or session_id,
            error=str(e),
            duration_ms=int((end_time - start_time).total_seconds() * 1000),
            started_at=start_time.isoformat(),
            completed_at=end_time.isoformat(),
        )


@app.delete("/sessions/{session_id}")
async def close_session_endpoint(session_id: str):
    """Close a specific session."""
    success = await session_registry.close_session(session_id)
    if success:
        return {"success": True, "message": f"Session {session_id} closed"}
    else:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")


@app.get("/sessions")
async def list_sessions():
    """List all active sessions."""
    return {
        "success": True,
        "sessions": session_registry.list_sessions(),
        "count": len(session_registry._sessions),
    }


@app.delete("/sessions")
async def close_all_sessions():
    """Close all active sessions."""
    await session_registry.close_all()
    return {"success": True, "message": "All sessions closed"}


@app.websocket("/ws/{run_id}")
async def websocket_endpoint(websocket: WebSocket, run_id: str):
    await websocket.accept()
    try:
        while True:
            # We can use this to stream progress later
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        print(f"Client disconnected from WebSocket for {run_id}")


# ============================================
# FRACTIONAL TOOLS (For Node.js Orchestrator)
# ============================================


class NavigateRequest(BaseModel):
    url: str


class ClickRequest(BaseModel):
    selector: str


class FillRequest(BaseModel):
    selector: str
    value: str


class ExtractRequest(BaseModel):
    instruction: str


class ScreenshotRequest(BaseModel):
    label: Optional[str] = None


# Global browser context for tools
_browser_instance = None
_context_instance = None
_page_instance = None


async def get_page():
    global _browser_instance, _context_instance, _page_instance
    if not _page_instance:
        from playwright.async_api import async_playwright

        pw = await async_playwright().start()
        _browser_instance = await pw.chromium.launch(headless=True)
        _context_instance = await _browser_instance.new_context()
        _page_instance = await _context_instance.new_page()
    return _page_instance


@app.post("/navigate")
async def navigate(request: NavigateRequest):
    page = await get_page()
    await page.goto(request.url)
    return {"success": True, "url": page.url}


@app.post("/click")
async def click(request: ClickRequest):
    page = await get_page()
    # Try text match if not a selector
    if not (request.selector.startswith(".") or request.selector.startswith("#")):
        await page.click(f"text={request.selector}", timeout=5000)
    else:
        await page.click(request.selector, timeout=5000)
    return {"success": True}


@app.post("/fill")
async def fill(request: FillRequest):
    page = await get_page()
    await page.fill(request.selector, request.value)
    return {"success": True}


@app.post("/extract")
async def extract(request: ExtractRequest):
    page = await get_page()
    content = await page.content()
    # In a real app, use an LLM here to extract specific info from content
    # For now, return a snippet
    return {"success": True, "data": content[:1000]}


@app.post("/screenshot")
async def screenshot(request: ScreenshotRequest):
    page = await get_page()
    path = f"screenshots/{request.label or 'current'}.png"
    os.makedirs("screenshots", exist_ok=True)
    await page.screenshot(path=path)
    return {"success": True, "path": path}


@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)
