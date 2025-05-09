ARG NODE_VERSION=22-alpine
ARG PNPM_VERSION=8.15.4

FROM node:${NODE_VERSION} AS builder
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml .npmrc* ./
RUN pnpm install --frozen-lockfile --prod=false

COPY prisma ./prisma
COPY tsconfig*.json vitest.config.ts ./
COPY src ./src
COPY assets ./assets

RUN pnpm run db:gen
RUN pnpm run build

FROM node:${NODE_VERSION} AS runtime
RUN apk add --no-cache tini \
 && corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

ENV NODE_ENV=production PORT=4000
WORKDIR /app

RUN chown -R node:node /app

COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod              

COPY --from=builder /app/dist    ./dist
COPY --from=builder /app/prisma  ./prisma
COPY --from=builder /app/assets  ./assets

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod 755 /entrypoint.sh   

ENTRYPOINT ["/sbin/tini","--","/entrypoint.sh"]

HEALTHCHECK --interval=30s --timeout=3s CMD \
  wget -qO- http://localhost:${PORT}/health || exit 1