# ---- Dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci

# ---- Build ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG CACHEBUST=1
RUN npx prisma generate
RUN npm run build

# ---- Production ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY prisma ./prisma/
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY start.sh ./
RUN chmod +x start.sh

# Create .env as root so nextjs user can overwrite it at runtime
RUN echo "DATABASE_URL=placeholder" > .env && echo "SESSION_SECRET=placeholder" >> .env && chown nextjs:nodejs .env && chown -R nextjs:nodejs /app/node_modules/.prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["./start.sh"]
