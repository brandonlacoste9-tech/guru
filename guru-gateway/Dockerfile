FROM node:20-bookworm AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# 1. Install Python 3.11 & System Deps
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Copy the entire monorepo context (required to access sibling folders)
COPY . /app

# 3. Install Node dependencies
FROM base AS prod-deps
WORKDIR /app
COPY . /app
RUN pnpm install --prod --no-frozen-lockfile

# 4. Install Python dependencies for Browser Use
# 4. Install Python dependencies for Browser Use
# Install from PyPI and run playwright install in the same layer to ensure visibility
RUN pip3 install --no-cache-dir browser-use playwright --break-system-packages && \
    python3 -m playwright install chromium && \
    python3 -m playwright install-deps chromium

# 5. Build Gateway
FROM base AS build
WORKDIR /app
COPY . /app
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter guru-gateway run build

# 6. Final Image
FROM base
# Copy entire app directory from prod-deps to ensure we have all node_modules (root & package level)
COPY --from=prod-deps /app /app

# Explicitly copy browser-use folder again to be absolutely sure it exists
# Cache bust: 2026-01-26-02
COPY ./browser-use /app/browser-use
# Debug: List files to verify copy success
RUN ls -R /app/browser-use

# Overwrite with compiled assets
COPY --from=build /app/guru-gateway/dist /app/guru-gateway/dist

# Env vars for Python
ENV HEADLESS=true
ENV BROWSER_USE_LOG_LEVEL=info

# Expose Gateway Port
EXPOSE 18789

# Run from the gateway directory so paths align
# Run from the root so we can access everything if needed, but run the built JS directly
WORKDIR /app
CMD [ "node", "guru-gateway/dist/index.js" ]
