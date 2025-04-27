import { prisma } from '@/libs/prisma';
import { redis } from '@/libs/redis/index';
import { keyComments, keyParticipants, keyViews, keyVotes } from '@/libs/redis/keys';
import { calcHotScore } from '@/libs/utils/hot-score';

export class DebateService {
  static async getById(id: string) {
    const debate = await prisma.debate.findUniqueOrThrow({ where: { id } });

    await redis
      .multi()
      .incr(keyViews(id))
      .expireat(keyViews(id), Math.floor(debate.deadline.getTime() / 1000))
      .exec();

    return debate;
  }

  static async listHot(limit = 10) {
    const ids = await redis.zrevrange('debate:hot', 0, limit - 1);

    const rows = await prisma.debate.findMany({ where: { id: { in: ids } } });
    const map = new Map(rows.map(r => [r.id, r]));
    return ids.map(id => map.get(id)).filter(Boolean);
  }

  static async addComment({
    debateId,
    side,
    nickname,
    content,
    ipHash,
  }: {
    debateId: string;
    side: 'PRO' | 'CON';
    nickname: string;
    content: string;
    ipHash: string;
  }) {
    return prisma.$transaction(async tx => {
      await tx.comment.create({
        data: { debateId, side, nickname, content },
      });

      await redis
        .multi()
        .incr(keyComments(debateId))
        .hincrby(keyVotes(debateId), side.toLowerCase(), 1)
        .sadd(keyParticipants(debateId), ipHash)
        .exec();
    });
  }

  static async recalcHot(id: string) {
    const [v, c, p, debate] = await Promise.all([
      redis.get(keyViews(id)),
      redis.get(keyComments(id)),
      redis.scard(keyParticipants(id)),
      prisma.debate.findUniqueOrThrow({ where: { id } }),
    ]);

    const score = calcHotScore({
      views: Number(v ?? 0),
      comments: Number(c ?? 0),
      participants: Number(p ?? 0),
      startAt: debate.startAt ?? debate.createdAt,
    });

    await Promise.all([
      redis.zadd('debate:hot', score, id),
      prisma.debate.update({ where: { id }, data: { hotScore: score } }),
    ]);

    return score;
  }

  static async create({
    title,
    content,
    startAt,
    deadline,
    categoryId,
  }: {
    title: string;
    content?: string;
    startAt?: Date | string;
    deadline: Date | string;
    categoryId?: number;
  }) {
    const debate = await prisma.debate.create({
      data: {
        title,
        content,
        startAt: startAt ? new Date(startAt) : undefined,
        deadline: new Date(deadline),
        categoryId,
        status: startAt && new Date(startAt) > new Date() ? 'upcoming' : 'ongoing',
      },
    });

    const pipeline = redis
      .multi()
      .set(keyViews(debate.id), 0, 'EXAT', Math.floor(debate.deadline.getTime() / 1000))
      .set(keyComments(debate.id), 0, 'EXAT', Math.floor(debate.deadline.getTime() / 1000))
      .del(keyVotes(debate.id))
      .del(keyParticipants(debate.id))
      .zadd('debate:hot', 0, debate.id);

    await pipeline.exec();
    return debate;
  }
}
