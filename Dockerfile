# ─────────────────────────────────────────────────────────────────────────────
# Production Dockerfile for AURELIA Storefront (Next.js 15 + Prisma + MySQL)
# Optimized for blitz.cloud container hosting (runs as non-root on port 8080)
# ─────────────────────────────────────────────────────────────────────────────

# ── 1. Install dependencies ──────────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ── 2. Build the application ─────────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js standalone bundle
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# ── 3. Production runner ─────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Install Prisma CLI globally for instant database migration support on boot
RUN npm install -g prisma@6.19.0

# Create non-root user (blitz.cloud requires non-root user)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public static assets
COPY --from=builder /app/public ./public

# Copy standalone Next.js server and client bundles
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and migrations for deploy-time schema sync
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copy startup entrypoint
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 8080

ENTRYPOINT ["./docker-entrypoint.sh"]
