import fp from 'fastify-plugin';
import { z } from 'zod';

import { addComment, createDebate, getDebate, getDebateList } from './debate.controller.js';
import {
  CommentBody,
  CreateDebateBody,
  Debate,
  DebateIdParam,
  DebateList,
  DebateListQuery,
} from './debate.schema.js';

export default fp(app => {
  app.get(
    '/sidebar',
    {
      schema: {
        querystring: DebateListQuery,
        response: { 200: DebateList },
      },
    },
    getDebateList,
  );

  app.get(
    '/:id',
    {
      schema: {
        params: DebateIdParam,
        response: { 200: Debate },
      },
    },
    getDebate,
  );

  app.post(
    '/',
    {
      schema: {
        body: CreateDebateBody,
        response: { 201: Debate },
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
