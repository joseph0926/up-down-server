import { pino } from 'pino';

import { config } from './env.js';

const isProd = config.NODE_ENV === 'production';

export const logger = pino({
  level: config.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),

  transport: isProd
    ? {
        target: 'pino-loki',
        options: {
          host: config.LOKI_HOST,
          basicAuth: config.LOKI_TOKEN,
          labels: { app: 'up-down', env: config.NODE_ENV },
          interval: 5_000,
          timeout: 10_000,
        },
      }
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'yyyy-mm-dd HH:MM:ss.l' },
      },
  base: undefined,
  serializers: {
    err: pino.stdSerializers.err,
  },
  redact: ['req.headers.authorization', 'password'],
});
