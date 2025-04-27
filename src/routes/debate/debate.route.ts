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
    '/',
    {
      schema: {
        querystring: DebateListQuery,

        response: {
          200: z.object({
            data: DebateList,
            success: z.literal(true),
            message: z.string().optional(),
          }),
        },
      },
    },
    async (req, reply) => {
      const list = await getDebateList(req);
      reply.ok(list, '토론 리스트를 불러왔습니다.');
    },
  );

  app.get(
    '/:id',
    {
      schema: {
        params: DebateIdParam,
        response: {
          200: z.object({
            data: Debate,
            success: z.literal(true),
            message: z.string().optional(),
          }),
        },
      },
    },
    async (req, reply) => {
      const debate = await getDebate(req);
      reply.ok(debate);
    },
  );

  app.post(
    '/',
    {
      schema: {
        body: CreateDebateBody,
        response: {
          201: z.object({
            data: Debate,
            success: z.literal(true),
            message: z.string().optional(),
          }),
        },
      },
    },
    async (req, reply) => {
      const debate = await createDebate(req);
      reply.status(201).ok(debate, '토론이 생성되었습니다.');
    },
  );

  app.post(
    '/comment',
    {
      schema: {
        body: CommentBody,
        response: {
          200: z.object({
            data: z.object({ ok: z.literal(true) }),
            success: z.literal(true),
            message: z.string().optional(),
          }),
        },
      },
    },
    async (req, reply) => {
      await addComment(req);
      reply.ok({ ok: true }, '댓글이 등록되었습니다.');
    },
  );
});
