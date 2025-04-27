import { buildServer } from './server.js';

const app = await buildServer();
await app.listen({ port: Number(process.env.PORT ?? 4000), host: '0.0.0.0' });
app.log.info(`서버 실행: http://localhost:${process.env.PORT ?? 4000}`);

const shutdown = (signal: string) => {
  app.log.info(`${signal} received - shutting down...`);
  app
    .close()
    .then(() => {
      app.log.info('HTTP server closed');
      process.exit(0);
    })
    .catch((err: unknown) => {
      app.log.error({ err }, 'Shutdown failure');
      process.exit(1);
    });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
