import { resolve } from 'node:path';

import { config as dotenvConfig } from 'dotenv';
import { cleanEnv, num, port, str, url } from 'envalid';

const ENV = process.env.NODE_ENV ?? 'development';

dotenvConfig({ path: resolve(process.cwd(), `.env.${ENV}.local`), override: true });
dotenvConfig({ path: resolve(process.cwd(), `.env.${ENV}`), override: false });
dotenvConfig({ path: resolve(process.cwd(), '.env'), override: false });

export const config = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'test', 'staging', 'production'] }),
  PORT: port({ default: 4000 }),
  LOG_LEVEL: str({ default: 'info' }),
  LOKI_HOST: url(),
  LOKI_USERNAME: str(),
  LOKI_PASSWORD: str(),
  RATE_LIMIT_WINDOW: num({ default: 60_000 }),
  RATE_LIMIT_MAX: num({ default: 100 }),
  DATABASE_URL: str(),
  REDIS_URL: str(),
} as const);

export type Env = Readonly<typeof config>;
