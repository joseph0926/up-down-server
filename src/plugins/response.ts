import fp from 'fastify-plugin';

export default fp(app => {
  app.decorateReply('ok', function (data: unknown, msg?: string) {
    this.send({ data, success: true, ...(msg ? { message: msg } : {}) });
  });
});
