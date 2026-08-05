#!/bin/sh
set -e
export PATH="./node_modules/.bin:$PATH"

# Load .env if exists
if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

# Run prisma db push
if [ -n "$DATABASE_URL" ]; then
  ./node_modules/.bin/prisma db push --accept-data-loss --skip-generate || echo "DB push skipped"
else
  echo "WARNING: DATABASE_URL not set, skipping DB push"
fi

# Seed (once, errors are OK)
npx tsx prisma/seed.ts || echo "Seed skipped"

# Start server
exec node server.js
