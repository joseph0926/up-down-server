import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import csrf from '@fastify/csrf-protection';
import rateLimit from '@fastify/rate-limit';
import fp from 'fastify-plugin';

import { config } from '@/libs/env';

/**
 * 보안 플러그인
 */
export default fp(async app => {
  /*  CSP + cors */
  await app.register(cors, {
    origin: config.CORS_ORIGIN.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    hook: 'preHandler',
  });

  /* Rate-Limit */
  await app.register(rateLimit, {
    global: true,
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW,
    // ban: 15, TODO: ban을 넣어야할지 문의 필요
    allowList: config.RL_ALLOWLIST.split(',').filter(Boolean),
  });

  /* Cookie + CSRF */
  await app.register(cookie, { secret: config.COOKIE_SECRET });
  if (config.NODE_ENV !== 'development') {
    await app.register(csrf, { cookieOpts: { sameSite: 'lax', path: '/' } });
  }
});
