import { z } from 'zod';

import { apiResponse, cursorList } from '@/schemas/common.schema';

const ISO = z.string().datetime();
export const CommentSide = z.enum(['PRO', 'CON']);

export const CommentBody = z.object({
  debateId: z.string().cuid(),
  side: CommentSide,
  nickname: z.string().min(1).max(20),
  content: z.string().min(1).max(300),
});

export const CommentLikeParam = z.object({ id: z.string().cuid() });
export const CommentListQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export const DebateParam = z.object({ debateId: z.string().cuid() });

export const CommentSchema = z.object({
  id: z.string().cuid(),
  debateId: z.string().cuid(),
  nickname: z.string(),
  content: z.string(),
  side: CommentSide,
  likes: z.number(),
  createdAt: ISO,
});

export const ResCommentList = apiResponse(cursorList(CommentSchema));
export const ResCommentOk = apiResponse(z.object({ ok: z.literal(true) }));

export type CommentDto = z.infer<typeof CommentSchema>;
export type CommentListDto = z.infer<typeof ResCommentList>['data'];
