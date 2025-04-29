import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { AsyncTask, CronJob } from 'toad-scheduler';

import { prisma } from '@/libs/prisma';
import { keyComments, keyParticipants, keyViews } from '@/libs/redis/keys';
import { calcHotScore } from '@/libs/utils/hot-score';

async function safeUpdate(app: FastifyInstance, id: string, score: number) {
  try {
    await prisma.debate.update({ where: { id }, data: { hotScore: score } });
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError && e.code === 'P2025') {
      await app.redis.zrem('debate:hot', id);
    } else {
      throw e;
    }
  }
}

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

      const existing = await prisma.debate.findMany({
        where: { id: { in: ids } },
        select: { id: true },
      });
      const alive = new Set(existing.map(d => d.id));

      const zPipe = app.redis.pipeline();
      const updatePromises: Promise<unknown>[] = [];
      const now = Date.now();

      ids.forEach((id, idx) => {
        const offset = idx * 3;
        const views = Number(raw[offset]?.[1] ?? 0);
        const comments = Number(raw[offset + 1]?.[1] ?? 0);
        const participants = Number(raw[offset + 2]?.[1] ?? 0);

        const score = calcHotScore({ views, comments, participants, startAt: now });

        if (!alive.has(id)) {
          zPipe.zrem('debate:hot', id);
          return;
        }

        zPipe.zadd('debate:hot', score, id);
        updatePromises.push(safeUpdate(app, id, score));
      });

      await Promise.all([zPipe.exec(), Promise.all(updatePromises)]);
    },
    err => app.log.error({ err }, 'hot-score task 실패'),
  );

  const job = new CronJob({ cronExpression: '15 * * * * *' }, task);
  app.scheduler.addCronJob(job);
});
