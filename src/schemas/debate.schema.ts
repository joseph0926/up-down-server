import { z } from 'zod';

export const getDebateListQuery = z
  .object({
    page: z
      .string()
      .transform(v => Number(v))
      .pipe(z.number().int().min(1).default(1))
      .optional(),
    size: z
      .string()
      .transform(v => Number(v))
      .pipe(z.number().int().min(5).max(100).default(20))
      .optional(),
    status: z.enum(['ongoing', 'closed']).optional(),
    category: z.string().min(1).optional(),
    sort: z.enum(['deadline', 'latest']).optional(),
  })
  .strict();
export type GetDebateListQueryType = z.infer<typeof getDebateListQuery>;
