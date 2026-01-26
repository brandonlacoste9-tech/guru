FROM node:20-bookworm AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# 1. Install System Deps
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Copy Monorepo Context
COPY . /app

# 3. Install Dependencies
# This will respect .npmrc (shamefully-hoist) and package.json (overrides)
RUN pnpm install --no-frozen-lockfile

# 4. Build API
RUN pnpm --filter @guru/api run build

# 5. Runtime
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["node", "dist/index.js"]
