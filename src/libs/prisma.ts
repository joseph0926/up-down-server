import { PrismaClient } from '@prisma/client';

import { logger } from '@/libs/logger';

export const prisma = new PrismaClient({
  log: [{ emit: 'event', level: 'error' }],
});

prisma.$on('error', e => logger.error({ err: e }, 'Prisma error'));
