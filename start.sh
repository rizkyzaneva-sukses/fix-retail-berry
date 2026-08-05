#!/bin/sh
set -e
export PATH="./node_modules/.bin:$PATH"
./node_modules/.bin/prisma db push --accept-data-loss --skip-generate
npx tsx prisma/seed.ts || echo "Seed skipped"
exec node server.js
