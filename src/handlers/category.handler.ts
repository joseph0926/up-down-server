import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import {
  createCategoryController,
  getAllCategoriesController,
} from '@/controllers/category.controller';
import { fail, ok } from '@/libs/utils/api';
import { createCategoryBodySchema } from '@/schemas/category.schema';

export async function createCategoryHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const body = createCategoryBodySchema.parse(req.body);
    const result = await createCategoryController(body);
    return reply.status(201).send(ok(result.data, result.message));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return reply.status(400).send(fail('VALIDATION', err.errors[0].message));
    }
    if (err instanceof Error && err.message === 'CATEGORY_DUPLICATE') {
      return reply.status(409).send(fail('CONFLICT', '같은 이름 또는 slug가 이미 존재합니다.'));
    }
    req.log.error({ err }, 'createCategoryHandler failed');
    return reply.status(500).send(fail('INTERNAL', 'Internal Server Error'));
  }
}

export async function getAllCategoriesHandler(_req: FastifyRequest, reply: FastifyReply) {
  try {
    const result = await getAllCategoriesController();
    return reply.status(200).send(ok(result.data, result.message));
  } catch (err) {
    reply.log.error({ err }, 'getAllCategoriesHandler failed');
    return reply.status(500).send(fail('INTERNAL', 'Internal Server Error'));
  }
}
