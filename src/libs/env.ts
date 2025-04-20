import 'dotenv/config';

import { cleanEnv, port, str } from 'envalid';

export const validators = {
  NODE_ENV: str({ choices: ['production', 'development', 'test'] }),
  PORT: port({ default: 3000 }),
  LOG_LEVEL: str({ default: 'info' }),
  LOKI_HOST: str(),
  LOKI_TOKEN: str({ devDefault: '' }),
  DATABASE_URL: str({ devDefault: '' }),
};

export const config = cleanEnv<typeof validators>(process.env, validators);
