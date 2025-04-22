import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { fetchDebatePage } from '@/controllers/debate.controller';
import { fail, ok } from '@/libs/utils/api';
import { getDebateListQuery, GetDebateListQueryType } from '@/schemas/debate.schema';

export async function getDebatesHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = getDebateListQuery.parse(request.query);
    const params: Required<GetDebateListQueryType> = {
      page: parsed.page ?? 1,
      size: parsed.size ?? 20,
      status: parsed.status ?? 'ongoing',
      category: parsed.category ?? '',
      sort: parsed.sort ?? 'deadline',
    };

    const data = await fetchDebatePage(params);

    return reply.status(200).send(ok(data, ''));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return reply.status(400).send(fail('VALIDATION', err.errors[0].message));
    }
    request.log.error({ err }, 'getDebatesHandler failed');
    return reply.status(500).send(fail('INTERNAL', 'Internal Server Error'));
  }
}
