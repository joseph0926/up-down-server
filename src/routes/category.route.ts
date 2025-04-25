import { FastifyInstance } from 'fastify';

import { createCategoryHandler } from '@/handlers/category.handler';
import { createCategoryBodySchema, createCategorySuccessSchema } from '@/schemas/category.schema';

export const registerCategoryRoutes = (app: FastifyInstance) => {
  app.post(
    '/',
    {
      schema: {
        description: '카테고리 생성',
        tags: ['Category'],
        body: createCategoryBodySchema,
        response: {
          201: createCategorySuccessSchema,
        },
      },
    },
    createCategoryHandler,
  );
};
