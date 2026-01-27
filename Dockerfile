# Stage 1: Builder
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@8.15.4

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
# Copy package.json files from workspace packages
COPY packages/database/package.json ./packages/database/
COPY packages/guru-core/package.json ./packages/guru-core/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build API
RUN pnpm --filter @guru/api run build

# Stage 2: Runtime
FROM node:20-alpine AS runtime

# Install Python and dependencies for Playwright
RUN apk add --no-cache \
    python3 \
    py3-pip \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set up Python virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# Copy package files for runtime dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
# Copy package.json files from each package (explicit to avoid glob issues)
COPY packages/database/package.json ./packages/database/
COPY packages/guru-core/package.json ./packages/guru-core/
COPY packages/shared/package.json ./packages/shared/

# Install only production dependencies
RUN npm install -g pnpm@8.15.4 && \
    pnpm install --frozen-lockfile --prod

# Copy built application
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules

# Copy Python requirements and install
COPY apps/api/requirements.txt ./apps/api/
RUN pip install --no-cache-dir -r apps/api/requirements.txt

# Install Playwright Chromium
RUN npx playwright install chromium

# Expose port
EXPOSE 4000

# Set environment
ENV NODE_ENV=production
ENV PORT=4000

# Run the application
CMD ["node", "apps/api/dist/index.js"]
