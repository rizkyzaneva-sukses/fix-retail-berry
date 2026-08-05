#!/bin/sh
export PATH="./node_modules/.bin:$PATH"

# Try to write .env (may fail if no permission - that's OK)
if [ -n "$DATABASE_URL" ]; then
  echo "DATABASE_URL=$DATABASE_URL" > .env 2>/dev/null && echo "SESSION_SECRET=*** >> .env 2>/dev/null && echo "✅ .env written" || echo "⚠️ .env write failed (permission), using env vars directly"
fi

# Run prisma db push (reads DATABASE_URL from env or .env)
if [ -n "$DATABASE_URL" ]; then
  prisma db push --accept-data-loss --skip-generate 2>&1 || echo "DB push skipped"
else
  echo "WARNING: DATABASE_URL not set, skipping DB push"
fi

# Seed (once, errors are OK)
npx tsx prisma/seed.ts 2>&1 || echo "Seed skipped"

# Start server (reads DATABASE_URL and SESSION_SECRET from env or .env)
exec node server.js
