import { z } from 'zod';

import { apiSuccess, paginated } from './common.schema.js';

export const getDebateListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(5).max(100).default(20),
  status: z.enum(['ongoing', 'closed']).default('ongoing'),
  category: z
    .string()
    .regex(/^[a-z0-9-]{3,32}$/i, 'invalid slug')
    .optional()
    .transform(v => (v === '' ? undefined : v)),
  sort: z.enum(['deadline', 'latest']).default('deadline'),
});
export type GetDebateListQuery = z.infer<typeof getDebateListQuerySchema>;

export const debateSummarySchema = z.object({
  id: z.string().cuid(),
  title: z.string(),
  deadline: z.string().datetime(),
  proRatio: z.number().min(0).max(1),
  conRatio: z.number().min(0).max(1),
  thumbUrl: z.string().nullable(),
  smallUrl: z.string().nullable(),
  status: z.enum(['ongoing', 'closed']).default('ongoing'),
});
export type DebateSummary = z.infer<typeof debateSummarySchema>;

export const commentSchema = z.object({
  id: z.string().cuid(),
  nickname: z.string(),
  content: z.string(),
  side: z.enum(['PRO', 'CON']),
  likes: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
});
export type CommentDTO = z.infer<typeof commentSchema>;

export const debateDetailSchema = debateSummarySchema.extend({
  content: z.string().nullable(),
  comments: z.array(commentSchema),
});
export type DebateDetail = z.infer<typeof debateDetailSchema>;

export const debateList200Schema = paginated(debateSummarySchema);
export const debatePageSuccessSchema = apiSuccess(debateList200Schema);
export const debateDetailSuccessSchema = apiSuccess(debateDetailSchema);

export type DebatePageSuccess = z.infer<typeof debatePageSuccessSchema>;
export type DebateDetailSuccess = z.infer<typeof debateDetailSuccessSchema>;

export const createDebateBodySchema = z.object({
  title: z.string().min(1).max(120),
  content: z.string().max(10_000).optional(),
  deadline: z.preprocess(
    v => (typeof v === 'string' || v instanceof Date ? new Date(v) : v),
    z.date().refine(
      d => {
        const now = new Date();
        const oneHour = 60 * 60 * 1000;
        const thirtyDays = 30 * 24 * oneHour;
        return d.getTime() - now.getTime() >= oneHour && d.getTime() - now.getTime() <= thirtyDays;
      },
      { message: '마감 시각은 1시간~30일 범위여야 합니다.' },
    ),
  ),
  categoryId: z.number().int().positive().optional(),
});

export const createDebateSuccessSchema = apiSuccess(
  z.object({
    id: z.string(),
    title: z.string(),
    deadline: z.string().datetime(),
  }),
);
export type CreateDebateBody = z.infer<typeof createDebateBodySchema>;
export type CreateDebateSuccess = z.infer<typeof createDebateSuccessSchema>;
