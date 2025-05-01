import fp from 'fastify-plugin';
import { ZodError } from 'zod';

import { AppError, ErrorCode } from '@/libs/error';

export default fp(app => {
  app.setErrorHandler((err, req, reply) => {
    if (err instanceof ZodError) {
      return reply.status(400).send({
        success: false,
        code: ErrorCode.VALIDATION,
        message: err.flatten().formErrors[0],
        data: null,
      });
    }

    if (err instanceof AppError) {
      return reply
        .status(err.status)
        .send({ success: false, code: err.code, message: err.message, data: null });
    }

    req.log.error({ err }, 'Unhandled error');
    reply.status(500).send({
      success: false,
      code: ErrorCode.INTERNAL,
      message: 'Internal Server Error',
      data: null,
    });
  });
});
