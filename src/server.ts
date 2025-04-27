import '@fastify/rate-limit';

import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import csrf from '@fastify/csrf-protection';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fastifyRedis from '@fastify/redis';
import sensible from '@fastify/sensible';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import Fastify, { FastifyError } from 'fastify';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';

import { config } from './libs/env.js';
import { pinoLoggerOption } from './libs/logger.js';
import { genRequestId } from './libs/request-id.js';
import { registerCategoryRoutes } from './routes/category.route.js';
import { registerDebateRoutes } from './routes/debate.route.js';

function isValidationError(err: FastifyError): err is FastifyError & { validation: unknown } {
  return 'validation' in err && err.validation !== undefined;
}

export async function buildServer() {
  /**
   * 앱 초기화 및 로깅 적용
   */
  const app = Fastify({
    logger: pinoLoggerOption,
    genReqId: genRequestId,
    trustProxy: true,
  })
    .setValidatorCompiler(validatorCompiler)
    .setSerializerCompiler(serializerCompiler);

  /** 보안 플러그인 */
  await app.register(helmet, {
    global: true,
    contentSecurityPolicy: false,
  });
  await app.register(rateLimit, {
    global: true,
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW,
    // ban: 15, TODO: ban을 넣어야할지 문의 필요
    allowList: config.RL_ALLOWLIST.split(',').filter(Boolean),
  });
  await app.register(cors, {
    origin: config.CORS_ORIGIN.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  /** 인증 관련 */
  await app.register(cookie, { secret: config.COOKIE_SECRET });
  if (config.NODE_ENV !== 'development') {
    await app.register(csrf, { cookieOpts: { sameSite: 'lax', path: '/' } });
  }

  /** Redis */
  await app.register(fastifyRedis, {
    url: config.REDIS_URL,
    tls: { rejectUnauthorized: false },
    maxRetriesPerRequest: null,
    enableAutoPipelining: true,
  });

  /** Swagger */
  if (config.NODE_ENV !== 'production') {
    await app.register(swagger, {
      openapi: {
        info: { title: 'Up&Down API', version: '1.0.0' },
        tags: [{ name: 'Debate', description: '찬반 토론' }],
      },
      transform: jsonSchemaTransform,
    });
    await app.register(swaggerUI, {
      routePrefix: '/docs',
      uiConfig: { docExpansion: 'list' },
    });
  }

  /** Error Helper */
  await app.register(sensible);

  /** Logging */
  app.addHook('onRequest', (req, _res, done) => {
    req.startTime = Date.now();
    req.log = req.log.child({ traceId: req.id });
    done();
  });
  app.addHook('onResponse', (req, reply) => {
    req.log.info(
      { status: reply.statusCode, duration: Date.now() - req.startTime },
      'Request completed',
    );
  });

  /** Router */
  app.get('/health', () => ({ status: 'ok' }));
  app.get('/health/redis', async () => ({ pong: await app.redis.ping() }));
  app.register(registerDebateRoutes, { prefix: '/debates' });
  app.register(registerCategoryRoutes, { prefix: '/categories' });

  /** Error Handler */
  app.setErrorHandler((err, req, reply) => {
    const level: 'warn' | 'error' = isValidationError(err) ? 'warn' : 'error';
    req.log[level]({ err }, 'Unhandled error');
    reply.status(err.statusCode ?? 500).send({ message: 'Internal Server Error' });
  });

  return app;
}
