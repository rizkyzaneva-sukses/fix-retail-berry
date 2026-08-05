# ---- Dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app
ARG DATABASE_URL
ARG SESSION_SECRET
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate

# ---- Build ----
FROM node:20-alpine AS builder
WORKDIR /app
ARG DATABASE_URL
ARG SESSION_SECRET
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN echo "DATABASE_URL=$DATABASE_URL" > .env
RUN echo "SESSION_SECRET=$SESSION_SECRET" >> .env
RUN npx prisma generate
RUN npm run build

# ---- Production ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

ARG DATABASE_URL
ARG SESSION_SECRET

COPY prisma ./prisma/
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
RUN chown -R nextjs:nodejs /app/node_modules/.prisma

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.env ./.env
COPY start.sh ./
RUN chmod +x start.sh
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["./start.sh"]
