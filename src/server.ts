import '@fastify/rate-limit';

import sensible from '@fastify/sensible';
import Fastify, { FastifyError } from 'fastify';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';

import redisPlugin from '@/plugins/redis';
import schedulePlugin from '@/plugins/schedule';
import securityPlugin from '@/plugins/security';
import swaggerPlugin from '@/plugins/swagger';

import hotScoreJob from './jobs/hot-score.job.js';
import statusSwitchJob from './jobs/status-switch.job.js';
import syncViewsJob from './jobs/sync-views.job.js';
import { pinoLoggerOption } from './libs/logger.js';
import { genRequestId } from './libs/request-id.js';
import debateRoute from './routes/debate/debate.route.js';

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
  await app.register(securityPlugin);

  /** Redis */
  await app.register(redisPlugin);

  /** Swagger */
  await app.register(swaggerPlugin);

  /** Schedule */
  await app.register(schedulePlugin);
  await app.register(syncViewsJob);
  await app.register(statusSwitchJob);
  await app.register(hotScoreJob);

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
  app.register(debateRoute, { prefix: '/debates' });

  /** Error Handler */
  app.setErrorHandler((err, req, reply) => {
    const level: 'warn' | 'error' = isValidationError(err) ? 'warn' : 'error';
    req.log[level]({ err }, 'Unhandled error');
    reply.status(err.statusCode ?? 500).send({ message: 'Internal Server Error' });
  });

  return app;
}
