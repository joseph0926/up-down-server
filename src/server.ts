import Fastify from 'fastify';
import pino from 'pino';

import { config } from './libs/env.js';
import { genRequestId } from './libs/request-id.js';

const isProd = config.NODE_ENV === 'production';

const commonPinoOpts: pino.LoggerOptions = {
  level: config.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
  base: undefined,
  serializers: { err: pino.stdSerializers.err },
  redact: ['req.headers.authorization', 'password'],
};

export async function buildServer() {
  const app = Fastify({
    logger: isProd
      ? {
          ...commonPinoOpts,
          transport: {
            target: 'pino-loki',
            options: {
              host: config.LOKI_HOST,
              basicAuth: config.LOKI_TOKEN,
              labels: { app: 'up-down', env: config.NODE_ENV },
              interval: 5_000,
              timeout: 10_000,
            },
          },
        }
      : {
          ...commonPinoOpts,
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'yyyy-mm-dd HH:MM:ss.l' },
          },
        },
    genReqId: genRequestId,
  });

  app.addHook('onRequest', req => {
    req.startTime = Date.now();
    req.log = req.log.child({ traceId: req.id });
  });

  app.addHook('onResponse', async (req, reply) => {
    req.log.info(
      { status: reply.statusCode, duration: Date.now() - req.startTime },
      'Request completed',
    );
  });

  app.get('/health', () => ({ status: 'ok' }));

  app.setErrorHandler((err, req, reply) => {
    const level = err.validation ? 'warn' : 'error';
    req.log[level]({ err }, 'Unhandled error');
    reply.status(err.statusCode ?? 500).send({ message: err.message });
  });

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = await buildServer();
  await app.listen({ port: Number(process.env.PORT ?? 4000), host: '0.0.0.0' });
  app.log.info(`서버 실행: http://localhost:${process.env.PORT ?? 4000}`);
}
