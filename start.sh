#!/bin/sh
set -e
export PATH="./node_modules/.bin:$PATH"

# Load .env if exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Run prisma db push with DATABASE_URL
if [ -n "$DATABASE_URL" ]; then
  ./node_modules/.bin/prisma db push --accept-data-loss --skip-generate || echo "DB push skipped"
else
  echo "WARNING: DATABASE_URL not set, skipping DB push"
fi

# Seed
npx tsx prisma/seed.ts || echo "Seed skipped"

# Start
exec node server.js
