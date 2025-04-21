import { Side } from '@prisma/client';

export interface CommentDTO {
  id: string;
  nickname: string;
  content: string;
  side: Side;
  likes: number;
  createdAt: string;
}
