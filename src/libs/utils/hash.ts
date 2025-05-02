import crypto from 'node:crypto';

import { config } from '../env.js';

const SECRET = config.IP_HASH_SECRET ?? '';

export const hashIp = (ip: string) =>
  crypto.createHash('sha256').update(`${ip}${SECRET}`).digest('hex');
