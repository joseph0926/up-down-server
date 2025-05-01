import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { AsyncTask, CronJob } from 'toad-scheduler';

import { prisma } from '@/libs/prisma';
import { keyComments, keyParticipants, keyViews } from '@/libs/redis/keys';
import { calcHotScore } from '@/libs/utils/hot-score';

import { runJob } from './run.job.js';

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
  const task = new AsyncTask('hot-score', () =>
    runJob(app.log, 'hot-score', async () => {
      const ids = await app.redis.zrange('debate:hot', 0, -1);
      if (!ids.length) return;

      const pipe = app.redis.pipeline();
      ids.forEach(id => pipe.get(keyViews(id)).get(keyComments(id)).scard(keyParticipants(id)));
      const raw = (await pipe.exec()) ?? [];

      const existing = new Set(
        (await prisma.debate.findMany({ where: { id: { in: ids } }, select: { id: true } })).map(
          d => d.id,
        ),
      );

      const zPipe = app.redis.pipeline();
      const promiseArr: Promise<unknown>[] = [];
      const now = Date.now();

      ids.forEach((id, i) => {
        const offset = i * 3;
        const score = calcHotScore({
          views: Number(raw[offset]?.[1] ?? 0),
          comments: Number(raw[offset + 1]?.[1] ?? 0),
          participants: Number(raw[offset + 2]?.[1] ?? 0),
          startAt: now,
        });

        if (!existing.has(id)) {
          zPipe.zrem('debate:hot', id);
          return;
        }

        zPipe.zadd('debate:hot', score, id);
        promiseArr.push(safeUpdate(app, id, score));
      });

      await Promise.all([zPipe.exec(), Promise.all(promiseArr)]);
    }),
  );

  app.scheduler.addCronJob(new CronJob({ cronExpression: '15 * * * * *' }, task));
});
