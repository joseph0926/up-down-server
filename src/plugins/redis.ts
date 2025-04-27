import fastifyRedis from '@fastify/redis';
import fp from 'fastify-plugin';

import { config } from '@/libs/env';

/**
 * Redis 플러그인
 */
export default fp(async app => {
  await app.register(fastifyRedis, {
    url: config.REDIS_URL,
    tls: { rejectUnauthorized: false },
    maxRetriesPerRequest: null,
    enableAutoPipelining: true,
  });
});
