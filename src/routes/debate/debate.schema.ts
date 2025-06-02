import { z } from 'zod';

import { apiResponse, cursorList } from '@/schemas/common.schema';

const ISO = z.string().datetime();

export const CategorySchema = z.object({
  id: z.number().int(),
  name: z.string(),
  slug: z.string(),
  createdAt: z.date(),
});

export const DebateListItem = z.object({
  id: z.string().cuid(),
  title: z.string(),
  content: z.string().nullable(),
  status: z.enum(['upcoming', 'ongoing', 'closed']),
  deadline: ISO,
  dDay: z.number().int(),
  proRatio: z.number(),
  conRatio: z.number(),
  proCount: z.number(),
  conCount: z.number(),
  commentCount: z.number(),
  viewCount: z.number(),
  hotScore: z.number(),
  thumbUrl: z.string().nullable(),
});

export const DebateSchema = DebateListItem.extend({
  startAt: ISO.nullable(),
  proCount: z.number(),
  conCount: z.number(),
  smallUrl: z.string().nullable(),
  createdAt: ISO,
  category: CategorySchema,
});

export const DebateListQuery = z.object({
  sort: z.enum(['hot', 'imminent', 'latest']).default('hot'),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  cursor: z.string().optional(),
});

export const DebateIdParam = z.object({ id: z.string().cuid() });

export const CreateDebateBody = z.object({
  title: z.string().min(3).max(100),
  content: z.string().optional(),
  startAt: ISO.optional(),
  deadline: ISO,
  categoryId: z.number().int().optional(),
});

export const DebateList = cursorList(DebateListItem);
export const ResDebateList = apiResponse(DebateList);

export const DebateDetail = DebateSchema;
export const ResDebateDetail = apiResponse(DebateDetail);

export const CreateDebate = DebateSchema;
export const ResCreateDebate = apiResponse(CreateDebate);

export type DebateDto = z.infer<typeof DebateSchema>;
export type DebateListItemDto = z.infer<typeof DebateListItem>;
export type DebateListDto = z.infer<typeof ResDebateList>['data'];
