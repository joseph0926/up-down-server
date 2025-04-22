import { Prisma } from '@prisma/client';

import { prisma } from '@/libs/prisma';
import { GetDebateListQueryType } from '@/schemas/debate.schema';
import { Paginated } from '@/types/common.type';
import { DebateSummaryDTO } from '@/types/debate.type';

export async function fetchDebatePage(
  params: Required<GetDebateListQueryType>,
): Promise<Paginated<DebateSummaryDTO>> {
  const { page, size, status, category, sort } = params;

  const now = new Date();

  const where: Prisma.DebateWhereInput = {};
  if (status === 'ongoing') where.deadline = { gt: now };
  if (status === 'closed') where.deadline = { lte: now };
  if (category) where.category = { is: { slug: category } };

  const orderBy: Prisma.DebateOrderByWithRelationInput[] =
    sort === 'latest' ? [{ createdAt: 'desc' }] : [{ deadline: 'asc' }];

  const skip = (page - 1) * size;
  const [total, rows] = await prisma.$transaction([
    prisma.debate.count({ where }),
    prisma.debate.findMany({
      where,
      orderBy,
      skip,
      take: size,
      select: {
        id: true,
        title: true,
        deadline: true,
        proCount: true,
        conCount: true,
      },
    }),
  ]);

  const items: DebateSummaryDTO[] = rows.map(d => {
    const sum = d.proCount + d.conCount || 1;
    return {
      id: d.id,
      title: d.title,
      deadline: d.deadline.toISOString(),
      proRatio: d.proCount / sum,
      conRatio: d.conCount / sum,
    };
  });

  return { items, total, page, size };
}
