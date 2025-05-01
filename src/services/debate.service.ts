import { Prisma } from '@prisma/client';

import { AppError, ErrorCode } from '@/libs/error';
import { prisma } from '@/libs/prisma';
import { redis } from '@/libs/redis/index';
import { keyComments, keyParticipants, keyViews, keyVotes } from '@/libs/redis/keys';
import { calcHotScore } from '@/libs/utils/hot-score';

type SortField = 'deadline' | 'createdAt';

export const selectDeadline = Prisma.validator<Prisma.DebateSelect>()({
  id: true,
  deadline: true,
});
export type RowDeadline = Prisma.DebateGetPayload<{ select: typeof selectDeadline }>;

export const selectCreated = Prisma.validator<Prisma.DebateSelect>()({
  id: true,
  createdAt: true,
});
export type RowCreated = Prisma.DebateGetPayload<{ select: typeof selectCreated }>;

export class DebateService {
  static async getDebateList(sort: 'hot' | 'imminent' | 'latest', limit = 10, cursor?: string) {
    try {
      let ids: string[] = [];
      let nextCursor: string | null = null;

      if (sort === 'hot') {
        const [scoreCursor] = cursor?.split(':') ?? [];
        const maxScore = scoreCursor ?? '+inf';
        const offset = cursor ? 1 : 0;

        const raw = await redis.zrevrangebyscore(
          'debate:hot',
          maxScore,
          '-inf',
          'WITHSCORES',
          'LIMIT',
          offset,
          limit,
        );
        ids = raw.filter((_, i) => i % 2 === 0);
        const scores = raw.filter((_, i) => i % 2 === 1);
        if (ids.length === limit) nextCursor = `${scores.at(-1)}:${ids.at(-1)}`;
      } else {
        const field: SortField = sort === 'imminent' ? 'deadline' : 'createdAt';
        const orderBy = sort === 'imminent' ? 'asc' : 'desc';
        const selectObj = field === 'deadline' ? selectDeadline : selectCreated;

        const [tsCursor, idCursor] = cursor?.split(':') ?? [];
        const epochCursor = tsCursor ? Number(tsCursor) : undefined;

        const whereCursor = epochCursor
          ? {
              OR: [
                {
                  [field]:
                    orderBy === 'asc'
                      ? { gt: new Date(epochCursor) }
                      : { lt: new Date(epochCursor) },
                },
                {
                  AND: [
                    { [field]: new Date(epochCursor) },
                    { id: orderBy === 'asc' ? { gt: idCursor } : { lt: idCursor } },
                  ],
                },
              ],
            }
          : undefined;

        const rows = await prisma.debate.findMany({
          where: whereCursor,
          orderBy: [{ [field]: orderBy }, { id: orderBy }] as const,
          take: limit,
          select: selectObj,
        });

        ids = rows.map(r => r.id);
        if (rows.length === limit) {
          const last = rows.at(-1) as RowDeadline | RowCreated;
          const lastDate =
            field === 'deadline' ? (last as RowDeadline).deadline : (last as RowCreated).createdAt;
          nextCursor = `${lastDate.getTime()}:${last.id}`;
        }
      }

      if (!ids.length) return { items: [], nextCursor: null };

      const rows = await prisma.debate.findMany({ where: { id: { in: ids } } });
      const map = new Map(rows.map(r => [r.id, r]));

      const items = ids
        .map(id => map.get(id)!)
        .map(row => ({
          id: row.id,
          title: row.title,
          content: row.content,
          status: row.status,
          deadline: row.deadline.toISOString(),
          dDay: Math.ceil((row.deadline.getTime() - Date.now()) / 86_400_000),
          proRatio: ratio(row.proCount, row.conCount),
          conRatio: ratio(row.conCount, row.proCount),
          commentCount: row.commentCount,
          viewCount: row.viewCount,
          hotScore: row.hotScore,
          thumbUrl: row.thumbUrl,
        }));

      return { items, nextCursor };
    } catch (e) {
      console.error(e);
      throw new AppError(ErrorCode.INTERNAL, '토론 목록 조회 실패', 500);
    }
  }

  static async getById(id: string) {
    const debate = await prisma.debate.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!debate) throw new AppError(ErrorCode.NOT_FOUND, '토론을 찾을 수 없습니다.', 404);

    await redis
      .multi()
      .incr(keyViews(id))
      .expireat(keyViews(id), Math.floor(debate.deadline.getTime() / 1000))
      .exec();

    return {
      ...debate,
      dDay: Math.ceil((debate.deadline.getTime() - Date.now()) / 86_400_000),
      proRatio: ratio(debate.proCount, debate.conCount),
      conRatio: ratio(debate.conCount, debate.proCount),
    };
  }

  static async listHot(limit = 10) {
    const ids = await redis.zrevrange('debate:hot', 0, limit - 1);
    const rows = await prisma.debate.findMany({ where: { id: { in: ids } } });
    const map = new Map(rows.map(r => [r.id, r]));
    return ids.map(id => map.get(id)).filter(Boolean);
  }

  static async recalcHot(id: string) {
    const [v, c, p, debate] = await Promise.all([
      redis.get(keyViews(id)),
      redis.get(keyComments(id)),
      redis.scard(keyParticipants(id)),
      prisma.debate.findUnique({ where: { id } }),
    ]);

    if (!debate) throw new AppError(ErrorCode.NOT_FOUND, '토론을 찾을 수 없습니다.', 404);

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

  static async create(dto: {
    title: string;
    content?: string;
    startAt?: Date | string;
    deadline: Date | string;
    categoryId?: number;
  }) {
    try {
      const debate = await prisma.debate.create({
        data: {
          title: dto.title,
          content: dto.content,
          startAt: dto.startAt ? new Date(dto.startAt) : undefined,
          deadline: new Date(dto.deadline),
          categoryId: dto.categoryId,
          status: dto.startAt && new Date(dto.startAt) > new Date() ? 'upcoming' : 'ongoing',
        },
      });

      await redis
        .multi()
        .set(keyViews(debate.id), 0, 'EXAT', Math.floor(debate.deadline.getTime() / 1000))
        .set(keyComments(debate.id), 0, 'EXAT', Math.floor(debate.deadline.getTime() / 1000))
        .del(keyVotes(debate.id))
        .del(keyParticipants(debate.id))
        .zadd('debate:hot', 0, debate.id)
        .exec();

      return debate;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
        throw new AppError(ErrorCode.NOT_FOUND, '카테고리를 찾을 수 없습니다.', 404);
      }
      throw new AppError(ErrorCode.INTERNAL, '토론 생성 실패', 500);
    }
  }
}

function ratio(a: number, b: number) {
  return a + b ? a / (a + b) : 0;
}
