import fastifyRedis from '@fastify/redis';
import fp from 'fastify-plugin';

import { redis } from '@/libs/redis/index';

export default fp(async app => {
  await app.register(fastifyRedis, { client: redis, closeClient: false });

  app.redis.on('ready', () => app.log.info('Redis connected'));
  app.redis.on('error', err => app.log.error({ err }, 'Redis error'));
});
