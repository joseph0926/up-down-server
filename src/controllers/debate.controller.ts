import { Prisma } from '@prisma/client';
import { FastifyError } from 'fastify';
import { z } from 'zod';

import { prisma } from '@/libs/prisma';
import {
  createDebateRepo,
  DebateSummaryRow,
  debateSummarySelect,
} from '@/repositories/debate.repo';
import { paginated } from '@/schemas/common.schema';
import type {
  CreateDebateBody,
  CreateDebateSuccess,
  GetDebateListQuery,
} from '@/schemas/debate.schema';
import { debateSummarySchema } from '@/schemas/debate.schema';

const paginatedDebateSchema = paginated(debateSummarySchema);
export type PaginatedDebate = z.infer<typeof paginatedDebateSchema>;

export async function fetchDebatePage(params: GetDebateListQuery): Promise<PaginatedDebate> {
  const { page, size, status, category, sort } = params;
  const now = new Date();

  let categoryFilter: Prisma.DebateWhereInput = {};
  if (category) {
    const cat = await prisma.category.findUnique({
      where: { slug: category },
      select: { id: true },
    });

    if (!cat) {
      throw new Error('CATEGORY_NOT_FOUND');
    }
    categoryFilter = { categoryId: cat.id };
  }

  const where = {
    ...(status === 'ongoing' && { deadline: { gt: now } }),
    ...(status === 'closed' && { deadline: { lte: now } }),
    ...categoryFilter,
  } satisfies Prisma.DebateWhereInput;

  const orderBy =
    sort === 'latest' ? ({ createdAt: 'desc' } as const) : ({ deadline: 'asc' } as const);

  const skip = (page - 1) * size;

  const [total, rows]: [number, DebateSummaryRow[]] = await Promise.all([
    prisma.debate.count({ where }),
    prisma.debate.findMany({
      where,
      orderBy,
      skip,
      take: size,
      select: debateSummarySelect,
    }),
  ]);

  const items = rows.map(mapToSummary);

  return paginatedDebateSchema.parse({ items, total, page, size });
}

function mapToSummary(row: DebateSummaryRow) {
  const sum = row.proCount + row.conCount;
  const [proRatio, conRatio] = sum === 0 ? [0, 0] : [row.proCount / sum, row.conCount / sum];

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
