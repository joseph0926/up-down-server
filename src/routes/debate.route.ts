import { FastifyInstance } from 'fastify';
import { z } from 'zod';

import {
  createDebateHandler,
  getDebateDetailHandler,
  getDebatesHandler,
} from '@/handlers/debate.hander';
import { failSchema } from '@/schemas/common.schema';
import {
  createDebateBodySchema,
  createDebateSuccessSchema,
  debateDetailSuccessSchema,
  debatePageSuccessSchema,
  getDebateListQuerySchema,
} from '@/schemas/debate.schema';

export const registerDebateRoutes = (app: FastifyInstance) => {
  app.get(
    '/',
    {
      schema: {
        tags: ['Debate'],
        summary: '토론 목록',
        querystring: getDebateListQuerySchema,
        response: {
          200: debatePageSuccessSchema,
          400: failSchema,
          404: failSchema,
          500: failSchema,
        },
      },
    },
    getDebatesHandler,
  );
  app.get(
    '/:id',
    {
      schema: {
        tags: ['Debate'],
        summary: '토론 상세',
        params: z.object({ id: z.string().cuid() }),
        response: {
          200: debateDetailSuccessSchema,
          400: failSchema,
          404: failSchema,
          500: failSchema,
        },
      },
    },
    getDebateDetailHandler,
  );
  app.post(
    '/',
    {
      schema: {
        tags: ['Debate'],
        description: '새 토론 생성',
        body: createDebateBodySchema,
        response: {
          201: createDebateSuccessSchema,
          400: failSchema,
          404: failSchema,
          500: failSchema,
        },
      },
    },
    createDebateHandler,
  );
};
