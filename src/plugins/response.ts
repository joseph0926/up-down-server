import fp from 'fastify-plugin';

export default fp(app => {
  app.decorateReply('ok', function (data: unknown, message = '') {
    this.send({ success: true, data, message });
  });
  app.decorateReply('fail', function (code, message, status = 400) {
    this.status(status).send({ success: false, code, message, data: null });
  });
});
declare module 'fastify' {
  interface FastifyReply {
    ok(data: unknown, msg?: string): void;
    fail(code: string, msg: string, status?: number): void;
  }
}
