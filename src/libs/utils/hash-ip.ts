import crypto from 'crypto';

export const hashIp = (ip: string) => {
  return crypto.createHash('sha256').update(ip).digest('hex');
};
