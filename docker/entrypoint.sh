set -e

echo "📌 Running Prisma generate & DB push..."
pnpm run db:gen:prod
pnpm run db:push:prod

echo "🚀 Starting Fastify…"
exec pnpm run start
