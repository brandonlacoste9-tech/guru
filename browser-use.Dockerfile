FROM python:3.11-slim-bookworm

WORKDIR /app

# 1. Install system tools
RUN apt-get update && apt-get install -y \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 2. Copy source code
COPY . .

# 3. Install Python dependencies (from subdirectory)
RUN pip install --no-cache-dir ./browser-use

# 4. Install Playwright Browsers (Chromium only to save space/time)
RUN playwright install chromium
RUN playwright install-deps chromium

# 5. Env vars for headless mode
ENV HEADLESS=true
ENV BROWSER_USE_LOG_LEVEL=info

# 6. Run the Agent Bridge
CMD ["python", "-u", "browser-use/python_bridge/browser_use_agent.py"]
