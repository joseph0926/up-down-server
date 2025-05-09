#!/usr/bin/env sh
set -e

echo "📄 Running Gen..."
pnpm run db:gen 

echo "📄 Running migrations..."
pnpm run migrate-deploy 

echo "🚀 Starting Fastify..."
exec pnpm run start