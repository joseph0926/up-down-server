import { z } from 'zod';

export const DebateListQuery = z.object({
  sort: z.enum(['hot', 'imminent', 'latest']).default('hot'),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  cursor: z.string().optional(),
});

export const DebateListItem = z.object({
  id: z.string().cuid(),
  title: z.string(),
  status: z.enum(['upcoming', 'ongoing', 'closed']),
  deadline: z.string().datetime(),
  dDay: z.number().int(),
  proRatio: z.number(),
  conRatio: z.number(),
  commentCount: z.number(),
  viewCount: z.number(),
  hotScore: z.number(),
  thumbUrl: z.string().nullable(),
});

export const DebateList = z.object({
  items: z.array(DebateListItem),
  nextCursor: z.string().nullable(),
});
export type DebateListType = z.infer<typeof DebateList>;
export type DebateListItemType = z.infer<typeof DebateListItem>;

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

export const Debate = z.object({
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

export type DebateDto = z.infer<typeof Debate>;
