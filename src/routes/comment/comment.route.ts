import fp from 'fastify-plugin';

import { addComment, getCommentList, likeComment } from './comment.controller.js';
import {
  CommentBody,
  CommentLikeParam,
  CommentListQuery,
  DebateParam,
  ResCommentList,
  ResCommentOk,
} from './comment.schema.js';

export default fp(app => {
  app.get(
    '/debates/:debateId/comments',
    {
      schema: {
        params: DebateParam,
        querystring: CommentListQuery,
        response: { 200: ResCommentList },
        summary: '댓글 목록',
        tags: ['Comment'],
      },
    },
    async (req, reply) => reply.ok(await getCommentList(req)),
  );

  app.post(
    '/comments',
    {
      schema: {
        body: CommentBody,
        response: { 200: ResCommentOk },
        summary: '댓글 생성',
        tags: ['Comment'],
      },
    },
    async (req, reply) => reply.ok(await addComment(req), '댓글이 등록되었습니다.'),
  );

  app.post(
    '/comments/:id/like',
    {
      schema: {
        params: CommentLikeParam,
        response: { 200: ResCommentOk },
        summary: '댓글 좋아요',
        tags: ['Comment'],
      },
    },
    async (req, reply) => reply.ok(await likeComment(req)),
  );
});
