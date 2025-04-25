import { Prisma } from '@prisma/client';

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
