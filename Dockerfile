FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Build args needed at build time for Next.js
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
ARG NEXT_PUBLIC_LIFF_ID=
ARG NEXT_PUBLIC_LIFF_MOCK=false

COPY . .
RUN npm run build

# ── production stage ──
FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/i18n ./i18n
COPY --from=builder /app/messages ./messages

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"]
