import fp from 'fastify-plugin';
import { AsyncTask, SimpleIntervalJob } from 'toad-scheduler';

import { prisma } from '@/libs/prisma';
import { keySideLikes, keyTopSide } from '@/libs/redis/keys';

import { runJob } from './run.job.js';

export default fp(app => {
  const task = new AsyncTask('sync-comment-likes', () =>
    runJob(app.log, 'sync-comment-likes', async () => {
      const now = new Date();
      const live = await prisma.debate.findMany({
        where: { status: { in: ['ongoing', 'upcoming'] }, deadline: { gt: now } },
        select: { id: true },
      });
      if (!live.length) return;

      const pipe = app.redis.pipeline();
      live.forEach(({ id }) => pipe.hgetall(keySideLikes(id)));
      const hashes = (await pipe.exec()) ?? [];

      const txs = live.map(({ id }, i) => {
        const h = hashes[i]?.[1] as Record<string, string> | null;
        const pro = Number(h?.pro ?? 0);
        const con = Number(h?.con ?? 0);
        return prisma.debate.update({
          where: { id },
          data: { proCommentLikes: pro, conCommentLikes: con },
        });
      });
      await prisma.$transaction(txs);

      const zPipe = app.redis.pipeline();
      live.forEach(({ id }) => {
        zPipe.zremrangebyrank(keyTopSide(id, 'PRO'), 0, -6);
        zPipe.zremrangebyrank(keyTopSide(id, 'CON'), 0, -6);
      });
      await zPipe.exec();
    }),
  );

  app.scheduler.addSimpleIntervalJob(new SimpleIntervalJob({ minutes: 2 }, task));
});
