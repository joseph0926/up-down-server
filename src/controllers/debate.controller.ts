import { Prisma } from '@prisma/client';
import { FastifyError } from 'fastify';

import { prisma } from '@/libs/prisma';
import {
  createDebateRepo,
  getDebateDetailRepo,
  getDebatePageRepo,
} from '@/repositories/debate.repo';
import { DebateSummaryRow } from '@/repositories/debate.select';
import type { CreateDebateBody, CreateDebateSuccess } from '@/schemas/debate.schema';
import {
  debateDetailSuccessSchema,
  debatePageSuccessSchema,
  getDebateListQuerySchema,
} from '@/schemas/debate.schema';

export class AppError extends Error {
  constructor(
    public code: 'NOT_FOUND' | 'INTERNAL',
    message: string,
  ) {
    super(message);
  }
}

export const getDebatePageController = async (rawQuery: unknown) => {
  const { page, size, status, category, sort } = getDebateListQuerySchema.parse(rawQuery);

  const now = new Date();
  const where: Prisma.DebateWhereInput = {
    ...(status === 'ongoing'
      ? { deadline: { gt: now } }
      : status === 'closed'
        ? { deadline: { lte: now } }
        : {}),
    ...(category ? { category: { slug: category } } : {}),
  };
  const orderBy =
    sort === 'latest' ? ({ createdAt: 'desc' } as const) : ({ deadline: 'asc' } as const);

  const [total, rows] = await getDebatePageRepo(where, orderBy, (page - 1) * size, size);

  if (category && total === 0) {
    const exists = await prisma.category.count({ where: { slug: category } });
    if (!exists) throw new AppError('NOT_FOUND', 'CATEGORY_NOT_FOUND');
  }

  const items = rows.map(mapToSummary);

  return debatePageSuccessSchema.parse({
    success: true,
    data: { items, total, page, size },
    message: '',
  });
};

export const getDebateDetailController = async (id: string) => {
  const row = await getDebateDetailRepo(id);
  if (!row) throw new AppError('NOT_FOUND', 'DEBATE_NOT_FOUND');

  const summary = mapToSummary(row);
  return debateDetailSuccessSchema.parse({
    success: true,
    data: {
      ...summary,
      content: row.content,
      comments: row.comments.map(c => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
      })),
    },
    message: '',
  });
};

function mapToSummary(row: DebateSummaryRow) {
  const sum = row.proCount + row.conCount;
  const proRatio = sum === 0 ? 0 : row.proCount / sum;
  const conRatio = sum === 0 ? 0 : row.conCount / sum;
  return {
    id: row.id,
    title: row.title,
    deadline: row.deadline.toISOString(),
    proRatio,
    conRatio,
  };
}

export const createDebateController = async (
  payload: CreateDebateBody,
): Promise<CreateDebateSuccess> => {
  try {
    const debate = await createDebateRepo(payload);

    return {
      success: true,
      data: {
        id: debate.id,
        title: debate.title,
        deadline: debate.deadline.toISOString(),
      },
      message: '토론이 생성되었습니다.',
    };
  } catch (err) {
    const e = err as FastifyError & { code?: string };
    if (e.code === 'P2025') {
      throw Object.assign(e, { statusCode: 404, message: '존재하지 않는 카테고리입니다.' });
    }
    throw e;
  }
};
