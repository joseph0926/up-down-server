import fp from 'fastify-plugin';
import { AsyncTask, SimpleIntervalJob } from 'toad-scheduler';

import { prisma } from '@/libs/prisma';
import { keyViews } from '@/libs/redis/keys';

export default fp(app => {
  const task = new AsyncTask(
    'sync-views',
    async () => {
      const now = new Date();
      const live = await prisma.debate.findMany({
        where: { status: 'ongoing', deadline: { gt: now } },
        select: { id: true },
      });
      if (!live.length) return;

      const pipe = app.redis.pipeline();
      live.forEach(({ id }) => pipe.get(keyViews(id)));
      const res = (await pipe.exec()) ?? [];

      await prisma.$transaction(
        live.map(({ id }, i) =>
          prisma.debate.update({
            where: { id },
            data: { viewCount: Number(res[i]?.[1] ?? 0) },
          }),
        ),
      );
    },
    err => app.log.error({ err }, 'sync-views task failed'),
  );

  const job = new SimpleIntervalJob({ minutes: 1 }, task);
  app.scheduler.addSimpleIntervalJob(job);
});
