import { z } from 'zod';

import { apiSuccess, paginated } from './common.schema.js';

export const getDebateListQuery = z.object({
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
export type GetDebateListQuery = z.infer<typeof getDebateListQuery>;

export const debateSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  deadline: z.string().datetime(),
  proRatio: z.number().min(0).max(1),
  conRatio: z.number().min(0).max(1),
});
export type DebateSummary = z.infer<typeof debateSummarySchema>;

export const commentSchema = z.object({
  id: z.string().uuid(),
  author: z.string(),
  content: z.string(),
  createdAt: z.string().datetime(),
});
export type CommentDTO = z.infer<typeof commentSchema>;

export const debateDetailSchema = debateSummarySchema.extend({
  content: z.string().nullable().optional(),
  comments: z.array(commentSchema),
});
export type DebateDetail = z.infer<typeof debateDetailSchema>;

export const debateList200Schema = paginated(debateSummarySchema);
export type DebateList200 = z.infer<typeof debateList200Schema>;

export const debatePageSuccessSchema = apiSuccess(debateList200Schema);
export type DebatePageSuccess = z.infer<typeof debatePageSuccessSchema>;
