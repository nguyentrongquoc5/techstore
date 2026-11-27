# =============================================================================
# TechStore Backend (API) – Production Dockerfile
# Node 20 + Prisma + SQLite + tsx (run TypeScript directly)
# =============================================================================
FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache openssl wget

# Copy package files first for better layer caching
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install all dependencies (tsx + prisma needed at runtime for seed & start)
RUN npm ci && npx prisma generate

# Application source
COPY . .

# Runtime directories for SQLite + product images
RUN mkdir -p prisma/data public/images/products

ENV NODE_ENV=production
ENV PORT=4000
ENV DATABASE_URL="file:./data/prod.db"

EXPOSE 4000

# Healthcheck used by Docker Compose / Render / Kubernetes
HEALTHCHECK --interval=15s --timeout=5s --start-period=45s --retries=5 \
  CMD wget -qO- http://127.0.0.1:4000/api/health || exit 1

# Start: ensure schema exists → seed demo data → start API server
CMD ["sh", "-c", "mkdir -p prisma/data && npx prisma db push --skip-generate && npx tsx prisma/seed.ts && npx tsx src/index.ts"]
