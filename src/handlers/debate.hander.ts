import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import {
  AppError,
  createDebateController,
  getDebateDetailController,
  getDebatePageController,
} from '@/controllers/debate.controller';
import { fail, ok } from '@/libs/utils/api';
import { createDebateBodySchema } from '@/schemas/debate.schema';

export const getDebatesHandler = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const result = await getDebatePageController(req.query);
    return reply.status(200).send(ok(result.data, ''));
  } catch (err) {
    if (err instanceof z.ZodError)
      return reply.status(400).send(fail('VALIDATION', err.errors[0].message));
    if (err instanceof AppError && err.code === 'NOT_FOUND')
      return reply.status(404).send(fail('NOT_FOUND', '카테고리가 존재하지 않습니다.'));
    req.log.error({ err }, 'getDebatesHandler failed');
    return reply.status(500).send(fail('INTERNAL', 'Internal Server Error'));
  }
};

export const getDebateDetailHandler = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  try {
    const result = await getDebateDetailController(req.params.id);
    return reply.status(200).send(ok(result.data, ''));
  } catch (err) {
    if (err instanceof AppError && err.code === 'NOT_FOUND')
      return reply.status(404).send(fail('NOT_FOUND', '토론이 존재하지 않습니다.'));
    req.log.error({ err }, 'getDebateDetailHandler failed');
    return reply.status(500).send(fail('INTERNAL', 'Internal Server Error'));
  }
};

export async function createDebateHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const body = createDebateBodySchema.parse(req.body);

    const result = await createDebateController(body);

    return reply.status(201).send(ok(result.data, result.message));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return reply.status(400).send(fail('VALIDATION', err.errors[0].message));
    }

    if (err instanceof Error && err.message === 'CATEGORY_NOT_FOUND') {
      return reply.status(404).send(fail('NOT_FOUND', '카테고리가 존재하지 않습니다.'));
    }

    req.log.error({ err }, 'createDebateHandler failed');
    return reply.status(500).send(fail('INTERNAL', 'Internal Server Error'));
  }
}
