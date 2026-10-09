#!/bin/sh
set -e

# Run Prisma database migrations against the production database if DATABASE_URL is provided
if [ -n "$DATABASE_URL" ]; then
  echo "[blitz] Applying database migrations..."
  npx prisma migrate deploy || echo "[blitz] Warning: migration deploy exited with non-zero code. Continuing startup..."
else
  echo "[blitz] DATABASE_URL not set at entrypoint, skipping prisma migrate."
fi

# Start the Next.js standalone server
echo "[blitz] Starting Next.js standalone application on port ${PORT:-8080}..."
exec node server.js
