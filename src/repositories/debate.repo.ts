import { Prisma } from '@prisma/client';

import { prisma } from '@/libs/prisma';
import { CreateDebateBody } from '@/schemas/debate.schema';

import { DebateSummaryRow, debateSummarySelect } from './debate.select.js';

export const getDebatePageRepo = (
  where: Prisma.DebateWhereInput,
  orderBy: Prisma.DebateOrderByWithRelationInput,
  skip: number,
  take: number,
) => {
  return prisma.$transaction([
    prisma.debate.count({ where }),
    prisma.debate.findMany({ where, orderBy, skip, take, select: debateSummarySelect }),
  ]) as Promise<[number, DebateSummaryRow[]]>;
};

export const getDebateDetailRepo = (id: string) => {
  return prisma.debate.findUnique({
    where: { id },
    select: {
      ...debateSummarySelect,
      content: true,
      comments: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          nickname: true,
          content: true,
          side: true,
          likes: true,
          createdAt: true,
        },
      },
    },
  });
};

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
