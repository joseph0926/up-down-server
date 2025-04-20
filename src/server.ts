import Fastify from 'fastify';

import { pinoLoggerOption } from './libs/logger.js';
import { genRequestId } from './libs/request-id.js';

export async function buildServer() {
  const app = Fastify({
    logger: pinoLoggerOption,
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
