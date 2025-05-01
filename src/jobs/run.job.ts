import { FastifyBaseLogger } from 'fastify';

export async function runJob(
  log: FastifyBaseLogger,
  name: string,
  fn: () => Promise<void>,
  retry = 3,
) {
  for (let i = 0; i < retry; i++) {
    try {
      await fn();
      return;
    } catch (err) {
      const wait = 1_000 * 2 ** i;
      log.error({ err }, `[JOB:${name}] 실패 ${i + 1}/${retry} (retry in ${wait}ms)`);
      if (i === retry - 1) {
        log.fatal({ err }, `[JOB:${name}] 모든 재시도 실패 - 작업 중단`);
        return;
      }
      await new Promise(r => setTimeout(r, wait));
    }
  }
}
