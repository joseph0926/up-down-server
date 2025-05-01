import { FastifyRequest } from 'fastify';

import { CommentService } from '@/services/comment.service';

import {
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

  const rows = await CommentService.list(debateId, cursor, limit);
  const payload = { items: rows, nextCursor: rows.at(-1)?.id ?? null };

  return CommentList.parse(payload);
};

export const addComment = async (req: FastifyRequest) => {
  const dto = CommentBody.parse(req.body);
  await CommentService.add({ ...dto, ipHash: req.ip });
  return CommentOk.parse({ ok: true });
};

export const likeComment = async (req: FastifyRequest) => {
  const { id } = CommentLikeParam.parse(req.params);
  await CommentService.like(id, req.ip);
  return CommentOk.parse({ ok: true });
};
