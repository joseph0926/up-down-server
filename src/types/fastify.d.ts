import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    startTime: number;
  }
  interface FastifyReply {
    ok: <T>(data: T, msg?: string) => void;
  }
}
