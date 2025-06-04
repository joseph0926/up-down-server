import { FastifyRequest } from 'fastify';

import { CommentService } from '@/services/comment.service';

import {
  BestComments,
  BestCommentsParam,
  CommentBody,
  CommentLikeParam,
  CommentList,
  CommentListQuery,
  CommentOk,
  DebateParam,
} from './comment.schema.js';

export const getCommentList = async (req: FastifyRequest) => {
  const { debateId } = DebateParam.parse(req.params);
  const { cursor, limit } = CommentListQuery.parse(req.query);

  const rows = await CommentService.list(debateId, req.ip, cursor, limit);
  const payload = { items: rows, nextCursor: rows.at(-1)?.id ?? null };

  return CommentList.parse(payload);
};

export const addComment = async (req: FastifyRequest) => {
  const dto = CommentBody.parse(req.body);
  await CommentService.add(dto, req.ip);
  return CommentOk.parse({ ok: true });
};

export const likeComment = async (req: FastifyRequest) => {
  const { id } = CommentLikeParam.parse(req.params);
  const { liked } = await CommentService.toggleLike(id, req.ip);
  return CommentOk.parse({ liked });
};

export const getBestComments = async (req: FastifyRequest) => {
  const { debateId } = BestCommentsParam.parse(req.params);
  const payload = await CommentService.bestComments(debateId);
  return BestComments.parse(payload);
};
