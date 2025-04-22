import { FastifyInstance } from 'fastify';

import { getDebatesHandler } from '@/handlers/debate.hander';
import { getDebateListQuery } from '@/schemas/debate.schema';

export function registerDebateRoutes(app: FastifyInstance) {
  app.get(
    '/debates',
    {
      schema: {
        querystring: getDebateListQuery,
      },
    },
    getDebatesHandler,
  );
}
