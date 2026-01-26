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
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

# 4. Install Python dependencies for Browser Use
RUN pip3 install --no-cache-dir ./browser-use --break-system-packages
RUN playwright install chromium
RUN playwright install-deps chromium

# 5. Build Gateway
FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm --filter guru-gateway run build

# 6. Final Image
FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/guru-gateway/dist /app/guru-gateway/dist

# Env vars for Python
ENV HEADLESS=true
ENV BROWSER_USE_LOG_LEVEL=info

# Expose Gateway Port
EXPOSE 18789

# Run from the gateway directory so paths align
WORKDIR /app/guru-gateway
CMD [ "pnpm", "start" ]
