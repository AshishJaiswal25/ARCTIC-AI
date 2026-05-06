# ── Stage 1: Build frontend ─────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: Production image ──────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache curl

# Production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Built frontend
COPY --from=builder /app/dist ./dist

# Server entry + server-side modules
COPY server.js .
COPY lib/ ./lib/

# Source files needed by lib/knowledge-rag-server.js at runtime
COPY src/constants.js ./src/constants.js
COPY src/data/fault-codes.js ./src/data/fault-codes.js
COPY src/data/knowledge/ ./src/data/knowledge/

# Pre-download embedding model at build time (avoids cold-start delay)
COPY scripts/preload-model.js ./scripts/preload-model.js
RUN node scripts/preload-model.js

EXPOSE 3001

CMD ["node", "server.js"]
