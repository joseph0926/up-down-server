import { z } from 'zod';

export const DebateIdParam = z.object({
  id: z.string().cuid(),
});

export const CreateDebateBody = z.object({
  title: z.string().min(3).max(100),
  content: z.string().optional(),
  startAt: z.string().datetime().optional(),
  deadline: z.string().datetime(),
  categoryId: z.number().int().optional(),
});

export const CommentBody = z.object({
  debateId: z.string().cuid(),
  side: z.enum(['PRO', 'CON']),
  nickname: z.string().min(1).max(20),
  content: z.string().min(1).max(300),
});

export const DebateDto = z.object({
  id: z.string().cuid(),
  title: z.string(),
  content: z.string().nullable(),
  status: z.enum(['upcoming', 'ongoing', 'closed']),
  startAt: z.string().datetime().nullable(),
  deadline: z.string().datetime(),
  proCount: z.number(),
  conCount: z.number(),
  viewCount: z.number(),
  hotScore: z.number(),
});

export type DebateDto = z.infer<typeof DebateDto>;
