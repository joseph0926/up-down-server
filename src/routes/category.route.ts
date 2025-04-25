import { FastifyInstance } from 'fastify';

import { createCategoryHandler, getAllCategoriesHandler } from '@/handlers/category.handler';
import {
  createCategoryBodySchema,
  createCategorySuccessSchema,
  getAllCategorySuccessSchema,
} from '@/schemas/category.schema';
import { failSchema } from '@/schemas/common.schema';

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
          400: failSchema,
          404: failSchema,
          500: failSchema,
        },
      },
    },
    createCategoryHandler,
  );
  app.get(
    '/',
    {
      schema: {
        description: '카테고리 전체 목록',
        tags: ['Category'],
        response: {
          200: getAllCategorySuccessSchema,
          400: failSchema,
          404: failSchema,
          500: failSchema,
        },
      },
    },
    getAllCategoriesHandler,
  );
};
