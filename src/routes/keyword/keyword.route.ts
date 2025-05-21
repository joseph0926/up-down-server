import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

import { config } from '@/libs/env';
import { apiFail } from '@/schemas/common.schema';
import { LiveKeyword, LiveKeywordResponse } from '@/schemas/keyword.schema';
import { getLiveKeywords } from '@/services/keyword.service';

export default fp((app: FastifyInstance) => {
  app.get(
    '/keywords/live',
    {
      schema: {
        response: {
          200: LiveKeywordResponse,
          500: apiFail,
        },
        summary: '실시간 키워드',
        tags: ['Keyword'],
      },
    },
    async (_req, reply) => {
      try {
        const keywords = await getLiveKeywords();
        return reply.send({
          success: true,
          message: '',
          data: { keywords },
        });
      } catch (e) {
        app.log.error(e);
        return reply.status(500).send({
          success: false,
          code: 'INTERNAL',
          message: 'keywords fetch failed',
          data: null,
        });
      }
    },
  );
  app.get('/keywords/live/stream', async (req, reply) => {
    const allowed = config.CORS_ORIGIN.split(',');
    const origin = req.headers.origin ?? '';

    if (allowed.includes(origin)) {
      console.log(origin);
      reply.raw.setHeader('Access-Control-Allow-Origin', origin);
      reply.raw.setHeader('Access-Control-Allow-Credentials', 'true');
      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Cache-Control', 'no-cache');
      reply.raw.setHeader('Connection', 'keep-alive');
    }

    reply.raw.flushHeaders();

    const push = (keywords: LiveKeyword[]) =>
      reply.raw.write(
        `data: ${JSON.stringify({
          success: true,
          message: '',
          data: { keywords },
        })}\n\n`,
      );

    push(await getLiveKeywords());

    const timer = setInterval(() => {
      getLiveKeywords()
        .then(push)
        .catch(err => app.log.error(err));
    }, 5000);

    req.raw.on('close', () => clearInterval(timer));
  });
});
