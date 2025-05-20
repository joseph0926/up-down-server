import fp from 'fastify-plugin';
import { AsyncTask, CronJob } from 'toad-scheduler';

const KEY_ZSET = 'live:kw';
const KEY_HASH = 'live:kw:index';

export default fp(app => {
  const task = new AsyncTask(
    'normalize-keyword-index',
    async () => {
      const raw = await app.redis.zrevrange(KEY_ZSET, 0, 4, 'WITHSCORES');
      const freq: [string, number][] = [];
      for (let i = 0; i < raw.length; i += 2) freq.push([raw[i], Number(raw[i + 1])]);

      if (freq.length === 0) return;

      const max = Math.max(...freq.map(([, s]) => s));

      const multi = app.redis.multi();
      freq.forEach(([word, score]) => {
        const index = max === 0 ? 0 : Math.round((score / max) * 100);
        multi.hset(KEY_HASH, word, index);
      });

      await multi.exec();
      app.log.debug({ freq, max }, `[keyword.job] hash 업데이트 완료 (max=${max})`);
    },
    err => app.log.error(err, '[keyword.job] 작업 실패'),
  );

  app.scheduler.addCronJob(
    new CronJob(
      {
        cronExpression: '*/1 * * * *',
      },
      task,
    ),
  );

  app.log.info('[keyword.job] normalize-keyword-index 등록');
});
