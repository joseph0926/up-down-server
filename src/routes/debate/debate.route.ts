import fp from 'fastify-plugin';

import { createDebate, getDebate, getDebateList } from './debate.controller.js';
import {
  CreateDebateBody,
  DebateIdParam,
  DebateListQuery,
  ResCreateDebate,
  ResDebateDetail,
  ResDebateList,
} from './debate.schema.js';

export default fp(app => {
  app.get(
    '/debates',
    {
      schema: {
        querystring: DebateListQuery,
        response: { 200: ResDebateList },
        summary: '토론 목록',
        tags: ['Debate'],
      },
    },
    async (req, reply) => {
      const list = await getDebateList(req);
      reply.ok(list, '토론 목록을 불러왔습니다.');
    },
  );

  app.get(
    '/debates/:id',
    {
      schema: {
        params: DebateIdParam,
        response: { 200: ResDebateDetail },
        summary: '토론 디테일',
        tags: ['Debate'],
      },
    },
    async (req, reply) => {
      const debate = await getDebate(req);
      reply.ok(debate);
    },
  );

  app.post(
    '/debates',
    {
      schema: {
        body: CreateDebateBody,
        response: { 201: ResCreateDebate },
        summary: '토론 생성',
        tags: ['Debate'],
      },
    },
    async (req, reply) => {
      const debate = await createDebate(req);
      reply.status(201).ok(debate, '토론이 생성되었습니다.');
    },
  );
});
