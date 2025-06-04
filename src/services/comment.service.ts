import { Comment, Prisma } from '@prisma/client';

import { AppError, ErrorCode } from '@/libs/error';
import { prisma } from '@/libs/prisma';
import { redis } from '@/libs/redis/index';
import { keyComments, keySideLikes, keyTopSide } from '@/libs/redis/keys';
import { hashIp } from '@/libs/utils/hash';
import { CommentDto } from '@/routes/comment/comment.schema';

const toCommentDto = (row: Comment) => ({
  id: row.id,
  debateId: row.debateId,
  nickname: row.nickname,
  content: row.content,
  side: row.side,
  likes: row.likes,
  createdAt: typeof row.createdAt === 'string' ? row.createdAt : row.createdAt?.toISOString(),
  liked: false as const,
  ipHash: row.ipHash,
});
const toDto = (row: Prisma.CommentUncheckedCreateInput) => ({
  ...row,
  createdAt: typeof row.createdAt === 'string' ? row.createdAt : row.createdAt?.toISOString(),
});

async function fetchBySide(debateId: string, side: 'PRO' | 'CON'): Promise<CommentDto[]> {
  const [, topScoreStr] = await redis.zrevrange(keyTopSide(debateId, side), 0, 0, 'WITHSCORES');

  let topScore = topScoreStr ? Number(topScoreStr) : undefined;

  if (topScore === undefined) {
    const max = await prisma.comment.aggregate({
      where: { debateId, side },
      _max: { likes: true },
    });
    if (max._max.likes === null) return [];
    topScore = max._max.likes;

    const sameScoreIds = await prisma.comment.findMany({
      where: { debateId, side, likes: topScore },
      select: { id: true },
    });
    if (sameScoreIds.length) {
      const m = redis.multi();
      sameScoreIds.forEach(r => m.zadd(keyTopSide(debateId, side), topScore!, r.id));
      await m.exec();
    }
  }

  const ids = await redis.zrevrangebyscore(keyTopSide(debateId, side), topScore, topScore);
  if (!ids.length) return [];

  const rows = await prisma.comment.findMany({
    where: { id: { in: ids } },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map(toCommentDto);
}

export class CommentService {
  static async add(
    body: {
      debateId: string;
      side: 'PRO' | 'CON';
      nickname: string;
      content: string;
    },
    clientIp: string | null,
  ) {
    if (!clientIp) {
      throw new AppError(ErrorCode.INTERNAL, 'IP를 확인할 수 없습니다.', 400);
    }

    const data = {
      ...body,
      ipHash: hashIp(clientIp),
    };

    try {
      return await prisma.$transaction(async tx => {
        const c = await tx.comment.create({ data });
        await redis.multi().incr(keyComments(body.debateId)).exec();
        return toDto(c);
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
        throw new AppError(ErrorCode.NOT_FOUND, '토론을 찾을 수 없습니다.', 404);
      }
      throw new AppError(ErrorCode.INTERNAL, '댓글 등록 중 오류', 500);
    }
  }

  static async toggleLike(commentId: string, clientIp: string | null) {
    if (!clientIp) {
      throw new AppError(ErrorCode.INTERNAL, 'IP를 확인할 수 없습니다.', 400);
    }

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new AppError(ErrorCode.NOT_FOUND, '댓글을 찾을 수 없습니다.', 404);

    const ipHash = hashIp(clientIp);

    return await prisma.$transaction(async tx => {
      const existing = await tx.commentLike.findUnique({
        where: { commentId_ipHash: { commentId, ipHash } },
      });

      if (existing) {
        await tx.commentLike.delete({ where: { id: existing.id } });
        await tx.comment.update({
          where: { id: commentId },
          data: { likes: { decrement: 1 } },
        });
        await tx.debate.update({
          where: { id: comment.debateId },
          data:
            comment.side === 'PRO'
              ? { proCommentLikes: { decrement: 1 } }
              : { conCommentLikes: { decrement: 1 } },
        });

        await redis
          .multi()
          .hincrby(keySideLikes(comment.debateId), comment.side.toLowerCase(), -1)
          .zincrby(keyTopSide(comment.debateId, comment.side), -1, commentId)
          .exec();

        return { liked: false };
      }

      await tx.commentLike.create({ data: { commentId, ipHash } });
      await tx.comment.update({
        where: { id: commentId },
        data: { likes: { increment: 1 } },
      });
      await tx.debate.update({
        where: { id: comment.debateId },
        data:
          comment.side === 'PRO'
            ? { proCommentLikes: { increment: 1 } }
            : { conCommentLikes: { increment: 1 } },
      });

      await redis
        .multi()
        .hincrby(keySideLikes(comment.debateId), comment.side.toLowerCase(), 1)
        .zincrby(keyTopSide(comment.debateId, comment.side), 1, commentId)
        .exec();

      return { liked: true };
    });
  }

  static async list(debateId: string, clientIp: string | null, cursor?: string, limit = 20) {
    if (!clientIp) {
      throw new AppError(ErrorCode.INTERNAL, 'IP를 확인할 수 없습니다.', 400);
    }

    const ipHash = hashIp(clientIp);

    const rows = await prisma.comment.findMany({
      where: { debateId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,

      include: {
        likesLog: {
          where: { ipHash },
          select: { id: true },
        },
      },
    });

    return rows.map(r => ({
      id: r.id,
      debateId: r.debateId,
      nickname: r.nickname,
      content: r.content,
      side: r.side,
      likes: r.likes,
      createdAt: r.createdAt.toISOString(),
      liked: r.likesLog.length > 0,
    }));
  }

  static async bestComments(debateId: string): Promise<{ pro: CommentDto[]; con: CommentDto[] }> {
    const [pro, con] = await Promise.all([
      fetchBySide(debateId, 'PRO'),
      fetchBySide(debateId, 'CON'),
    ]);
    return { pro, con };
  }
}
