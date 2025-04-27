import fp from 'fastify-plugin';
import { AsyncTask, CronJob } from 'toad-scheduler';

import { prisma } from '@/libs/prisma';
import { keyComments, keyParticipants, keyViews } from '@/libs/redis/keys';
import { calcHotScore } from '@/libs/utils/hot-score';

export default fp(app => {
  const task = new AsyncTask(
    'hot-score',
    async () => {
      const ids = await app.redis.zrange('debate:hot', 0, -1);
      if (!ids.length) return;

      const pipe = app.redis.pipeline();
      ids.forEach(id => {
        pipe.get(keyViews(id));
        pipe.get(keyComments(id));
        pipe.scard(keyParticipants(id));
      });

      const raw = (await pipe.exec()) ?? [];

      const zPipe = app.redis.pipeline();
      const dbUpdates: { id: string; score: number }[] = [];

      ids.forEach((id, idx) => {
        const offset = idx * 3;
        const views = Number(raw[offset]?.[1] ?? 0);
        const comments = Number(raw[offset + 1]?.[1] ?? 0);
        const participants = Number(raw[offset + 2]?.[1] ?? 0);
        const score = calcHotScore({ views, comments, participants, startAt: Date.now() });

        zPipe.zadd('debate:hot', score, id);
        dbUpdates.push({ id, score });
      });

      await Promise.all([
        zPipe.exec(),
        prisma.$transaction(
          dbUpdates.map(({ id, score }) =>
            prisma.debate.update({ where: { id }, data: { hotScore: score } }),
          ),
        ),
      ]);
    },
    err => app.log.error({ err }, 'hot-score task 실패'),
  );

  const job = new CronJob({ cronExpression: '15 * * * * *' }, task);
  app.scheduler.addCronJob(job);
});
