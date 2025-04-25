import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { createDebateController, fetchDebatePage } from '@/controllers/debate.controller';
import { fail, ok } from '@/libs/utils/api';
import { createDebateBodySchema, getDebateListQuery } from '@/schemas/debate.schema';

export async function getDebatesHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const params = getDebateListQuery.parse(req.query);
    const data = await fetchDebatePage(params);
    return reply.status(200).send(ok(data, ''));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return reply.status(400).send(fail('VALIDATION', err.errors[0].message));
    }
    if (err instanceof Error && err.message === 'CATEGORY_NOT_FOUND') {
      return reply.status(404).send(fail('NOT_FOUND', '카테고리가 존재하지 않습니다.'));
    }
    req.log.error({ err }, 'getDebatesHandler failed');
    return reply.status(500).send(fail('INTERNAL', 'Internal Server Error'));
  }
}

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
