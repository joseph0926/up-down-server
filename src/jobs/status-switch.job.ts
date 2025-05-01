import fp from 'fastify-plugin';
import { AsyncTask, CronJob } from 'toad-scheduler';

import { prisma } from '@/libs/prisma';

import { runJob } from './run.job.js';

export default fp(app => {
  const task = new AsyncTask('status-switch', () =>
    runJob(app.log, 'status-switch', async () => {
      const now = new Date();

      await prisma.debate.updateMany({
        where: { status: 'upcoming', startAt: { lte: now } },
        data: { status: 'ongoing' },
      });

      const closed = await prisma.debate.updateMany({
        where: { status: 'ongoing', deadline: { lte: now } },
        data: { status: 'closed', closedAt: now },
      });

      if (closed.count) app.log.info(`status-switch closed ${closed.count}`);
    }),
  );

  app.scheduler.addCronJob(new CronJob({ cronExpression: '0 */5 * * * *' }, task));
});
