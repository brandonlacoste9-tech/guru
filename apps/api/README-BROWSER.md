# Browser Automation Bridge

A high-level, agentic browser automation bridge for FloGuru, powered by `browser-use`.

## Architecture

The bridge consists of a direct Python process spawned from the Node.js API:

- **Python**: `antigravity_browser.py` uses `browser-use` to execute natural language tasks.
- **Node.js**: `BrowserBridge.ts` manages the child process and parses JSON results.

## Prerequisites

- Python 3.10+
- Playwright browsers installed: `playwright install chromium`
- Node.js 18+

## Environment Variables

Place these in your `apps/api/.env` file:

```env
# Essential
BROWSER_USE_API_KEY=your_key_here

# Providers
GOOGLE_AI_API_KEY=...
DEEPSEEK_API_KEY=...

# Config
PYTHON_PATH=python
BRIDGE_TIMEOUT_MS=120000
```

## Setup

1. Install Python dependencies:

   ```bash
   pip install -r requirements-browser.txt
   ```

2. Install Playwright:

   ```bash
   playwright install chromium
   ```

3. Run integration tests:
   ```bash
   npm run test:browser
   ```

## Usage (Agentic Tool)

The primary interface is the `browse_the_web` tool:

```typescript
const result = await browseTheWeb({
  task: "Find the latest news about FloGuru on Twitter",
  max_steps: 20,
});
```

## Performance Benchmarking

Run the benchmark script to analyze execution times:

```bash
python scripts/benchmark_browser.py
```

Check `benchmarks.md` for latest results.
