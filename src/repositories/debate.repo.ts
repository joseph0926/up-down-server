import { Prisma } from '@prisma/client';

import { prisma } from '@/libs/prisma';
import { CreateDebateBody } from '@/schemas/debate.schema';

export const debateSummarySelect = Prisma.validator<Prisma.DebateSelect>()({
  id: true,
  title: true,
  deadline: true,
  proCount: true,
  conCount: true,
});
export type DebateSummaryRow = Prisma.DebateGetPayload<{
  select: typeof debateSummarySelect;
}>;

export const createDebateRepo = async (payload: CreateDebateBody) => {
  return prisma.debate.create({
    data: {
      title: payload.title,
      content: payload.content ?? null,
      deadline: payload.deadline,
      category: payload.categoryId ? { connect: { id: payload.categoryId } } : undefined,
    },
    select: {
      id: true,
      title: true,
      deadline: true,
    },
  });
};
