import { pino } from 'pino';

import { config } from './env.js';

const isProd = config.NODE_ENV === 'production';

const lokiTransport: pino.LoggerOptions['transport'] = {
  target: 'pino-loki',
  options: {
    host: config.LOKI_HOST,
    basicAuth: {
      username: config.LOKI_USERNAME,
      password: config.LOKI_PASSWORD,
    },
    labels: { app: 'up-down', env: config.NODE_ENV },
    interval: 5,
    timeout: 10_000,
    silenceErrors: false,
  },
};
const prettyTransport: pino.LoggerOptions['transport'] = {
  target: 'pino-pretty',
  options: { colorize: true, translateTime: 'yyyy-mm-dd HH:MM:ss.l' },
};

export const pinoLoggerOption = {
  level: config.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
  base: undefined,
  serializers: { err: pino.stdSerializers.err },
  redact: ['req.headers.authorization', 'password'],
  // transport: config.NODE_ENV === 'production' ? lokiTransport : prettyTransport,
  transport: isProd ? lokiTransport : prettyTransport,
};

export const logger = pino(pinoLoggerOption);
