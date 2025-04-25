import { FastifyInstance } from 'fastify';

import { createDebateHandler, getDebatesHandler } from '@/handlers/debate.hander';
import { failSchema } from '@/schemas/common.schema';
import {
  createDebateBodySchema,
  createDebateSuccessSchema,
  debatePageSuccessSchema,
  getDebateListQuery,
} from '@/schemas/debate.schema';

export function registerDebateRoutes(app: FastifyInstance) {
  app.get(
    '/debates',
    {
      schema: {
        querystring: getDebateListQuery,
        response: {
          200: debatePageSuccessSchema,
          400: failSchema,
          404: failSchema,
        },
        tags: ['Debate'],
        summary: '토론 목록 조회',
      },
    },
    getDebatesHandler,
  );
  app.post(
    '/debates',
    {
      schema: {
        description: '새 토론 생성',
        tags: ['Debate'],
        body: createDebateBodySchema,
        response: {
          201: createDebateSuccessSchema,
        },
      },
    },
    createDebateHandler,
  );
}
