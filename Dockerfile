FROM node:20-slim AS base

RUN apt-get update && apt-get install -y \
    chromium \
    xvfb \
    dbus \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    fonts-liberation \
    libxss1 \
    libnss3 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libgbm1 \
    procps \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV CHROME_BIN=/usr/bin/chromium

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV CHROME_BIN=/usr/bin/chromium
ENV DISPLAY=:99

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/chrome-launcher ./node_modules/chrome-launcher
COPY --from=builder /app/node_modules/chrome-remote-interface ./node_modules/chrome-remote-interface
COPY --from=builder /app/shopee.co.id.txt ./shopee.co.id.txt

RUN chown -R nextjs:nodejs /app

USER root

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY <<'STARTSCRIPT' /app/start.sh
#!/bin/sh
set -e

mkdir -p /run/dbus
dbus-daemon --system --fork 2>/dev/null || true

Xvfb :99 -screen 0 1920x1080x24 -ac -nolisten tcp &
sleep 2

echo "Xvfb started. DISPLAY=$DISPLAY"
exec node server.js
STARTSCRIPT

RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]
