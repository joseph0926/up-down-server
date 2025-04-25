import '@fastify/rate-limit';

import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import csrf from '@fastify/csrf-protection';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
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
  const app = Fastify({
    logger: pinoLoggerOption,
    genReqId: genRequestId,
    trustProxy: true,
  })
    .setValidatorCompiler(validatorCompiler)
    .setSerializerCompiler(serializerCompiler);

  await app.register(helmet, {
    global: true,
    contentSecurityPolicy: false,
  });

  await app.register(rateLimit, {
    global: true,
    max: Number(config.RATE_LIMIT_MAX),
    timeWindow: `${config.RATE_LIMIT_WINDOW}`,
    ban: 3,
    allowList: ['127.0.0.1'],
  });

  await app.register(cors, {
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  if (config.NODE_ENV !== 'test') {
    await app.register(cookie, { secret: 'csrf' });
    await app.register(csrf, { cookieOpts: { sameSite: 'lax', path: '/' } });
  }

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

  app.addHook('onResponse', (req, reply) => {
    req.log.info(
      { status: reply.statusCode, duration: Date.now() - req.startTime },
      'Request completed',
    );
  });

  app.get('/health', { config: { rateLimit: false, cors: false } }, () => ({ status: 'ok' }));
  app.register(registerDebateRoutes, { prefix: '/debates' });
  app.register(registerCategoryRoutes, { prefix: '/categories' });

  app.setErrorHandler((err, req, reply) => {
    const level: 'warn' | 'error' = isValidationError(err) ? 'warn' : 'error';
    req.log[level]({ err }, 'Unhandled error');
    reply.status(err.statusCode ?? 500).send({ message: 'Internal Server Error' });
  });

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = await buildServer();
  await app.listen({ port: Number(process.env.PORT ?? 4000), host: '0.0.0.0' });
  app.log.info(`서버 실행: http://localhost:${process.env.PORT ?? 4000}`);
}
