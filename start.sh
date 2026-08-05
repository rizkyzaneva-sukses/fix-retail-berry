#!/bin/sh
set -e
export PATH="./node_modules/.bin:$PATH"

# Write .env file from runtime environment variables
# This ensures Next.js and Prisma can read them
if [ -n "$DATABASE_URL" ]; then
  echo "DATABASE_URL=$DATABASE_URL" > .env
  echo "SESSION_SECRET=$SESSION_SECRET" >> .env
  echo "✅ .env written from runtime env vars"
else
  echo "⚠️ DATABASE_URL not set!"
fi

# Run prisma db push
if [ -n "$DATABASE_URL" ]; then
  prisma db push --accept-data-loss --skip-generate || echo "DB push skipped"
else
  echo "WARNING: DATABASE_URL not set, skipping DB push"
fi

# Seed (once, errors are OK)
npx tsx prisma/seed.ts || echo "Seed skipped"

# Start server
exec node server.js
