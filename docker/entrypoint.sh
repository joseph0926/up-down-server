#!/usr/bin/env sh
set -e

echo "🔧 Prisma migrate deploy..."
pnpm run migrate-deploy

echo "🚀 Start Fastify"
exec pnpm run start
