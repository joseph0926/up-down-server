import fp from 'fastify-plugin';
import { z } from 'zod';

import { addComment, createDebate, getDebate } from './debate.controller.js';
import { CommentBody, CreateDebateBody, DebateDto, DebateIdParam } from './debate.schema.js';

export default fp(app => {
  app.get(
    '/:id',
    {
      schema: {
        params: DebateIdParam,
        response: { 200: DebateDto },
      },
    },
    getDebate,
  );

  app.post(
    '/',
    {
      schema: {
        body: CreateDebateBody,
        response: { 201: DebateDto },
      },
    },
    async (req, reply) => {
      const res = await createDebate(req);
      reply.status(201).send(res);
    },
  );

  app.post(
    '/comment',
    {
      schema: {
        body: CommentBody,
        response: { 200: z.object({ ok: z.literal(true) }) },
      },
    },
    addComment,
  );
});
