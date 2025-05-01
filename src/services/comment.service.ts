import { Prisma } from '@prisma/client';

import { AppError, ErrorCode } from '@/libs/error';
import { prisma } from '@/libs/prisma';
import { redis } from '@/libs/redis/index';
import { keyComments, keySideLikes, keyTopSide } from '@/libs/redis/keys';

const toDto = (row: Prisma.CommentUncheckedCreateInput) => ({
  ...row,
  createdAt: typeof row.createdAt === 'string' ? row.createdAt : row.createdAt?.toISOString(),
});

export class CommentService {
  static async add(body: {
    debateId: string;
    side: 'PRO' | 'CON';
    nickname: string;
    content: string;
    ipHash: string;
  }) {
    try {
      return await prisma.$transaction(async tx => {
        const c = await tx.comment.create({ data: body });
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

  static async like(commentId: string, ipHash: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new AppError(ErrorCode.NOT_FOUND, '댓글을 찾을 수 없습니다.', 404);

    const dup = await prisma.commentLike.findUnique({
      where: { commentId_ipHash: { commentId, ipHash } },
    });
    if (dup) throw new AppError(ErrorCode.CONFLICT, '이미 좋아요를 누르셨습니다.', 409);

    await prisma.$transaction([
      prisma.commentLike.create({ data: { commentId, ipHash } }),
      prisma.comment.update({ where: { id: commentId }, data: { likes: { increment: 1 } } }),
      prisma.debate.update({
        where: { id: comment.debateId },
        data:
          comment.side === 'PRO'
            ? { proCommentLikes: { increment: 1 } }
            : { conCommentLikes: { increment: 1 } },
      }),
    ]);

    await redis
      .multi()
      .hincrby(keySideLikes(comment.debateId), comment.side.toLowerCase(), 1)
      .zincrby(keyTopSide(comment.debateId, comment.side), 1, commentId)
      .exec();
  }

  static async list(debateId: string, cursor?: string, limit = 20) {
    const rows = await prisma.comment.findMany({
      where: { debateId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
    });
    return rows.map(toDto);
  }
}
