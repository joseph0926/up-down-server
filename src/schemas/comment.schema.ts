import { Side } from '@prisma/client';
import { z } from 'zod';

export const createCommentSchema = z.object({
  nickname: z.string().min(1).max(30),
  content: z.string().min(1).max(1000),
  side: z.nativeEnum(Side),
});
