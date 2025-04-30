import { FastifyRequest } from 'fastify';

import { DebateService } from '@/services/debate.service';

import {
  CommentBody,
  CreateDebateBody,
  DebateIdParam,
  DebateList,
  DebateListQuery,
  DebateSchema,
} from './debate.schema.js';

export const getDebateList = async (req: FastifyRequest) => {
  const { sort, limit, cursor } = DebateListQuery.parse(req.query);
  const res = await DebateService.getDebateList(sort, limit, cursor);
  return DebateList.parse(res);
};

export const getDebate = async (req: FastifyRequest) => {
  const { id } = DebateIdParam.parse(req.params);
  const debate = await DebateService.getById(id);
  return DebateSchema.parse(debate);
};

export const createDebate = async (req: FastifyRequest) => {
  const dto = CreateDebateBody.parse(req.body);
  const debate = await DebateService.create(dto);
  return DebateSchema.parse(debate);
};

export const addComment = async (req: FastifyRequest) => {
  const dto = CommentBody.parse(req.body);
  await DebateService.addComment({ ...dto, ipHash: req.ip });
  return { ok: true };
};
