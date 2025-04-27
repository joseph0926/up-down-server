import schedule from '@fastify/schedule';
import fp from 'fastify-plugin';

export default fp(async app => {
  await app.register(schedule);
});
