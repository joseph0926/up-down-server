import { Redis } from 'ioredis';

import { config } from '@/libs/env';
import { logger } from '@/libs/logger';

export const redis = new Redis(config.REDIS_URL, {
  tls: { rejectUnauthorized: false },
  maxRetriesPerRequest: null,
  enableAutoPipelining: true,
});

redis.on('ready', () => logger.info('Redis ready (libs/redis)'));
redis.on('error', err => logger.error({ err }, 'Redis error'));
