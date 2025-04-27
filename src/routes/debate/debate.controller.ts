import { FastifyRequest } from 'fastify';

import { DebateService } from '@/services/debate.service';

import { CommentBody, CreateDebateBody, DebateDto, DebateIdParam } from './debate.schema.js';

export const getDebate = async (req: FastifyRequest) => {
  const { id } = DebateIdParam.parse(req.params);
  const debate = await DebateService.getById(id);
  return DebateDto.parse(debate);
};

export const createDebate = async (req: FastifyRequest) => {
  const dto = CreateDebateBody.parse(req.body);
  const debate = await DebateService.create(dto);
  return DebateDto.parse(debate);
};

export const addComment = async (req: FastifyRequest) => {
  const dto = CommentBody.parse(req.body);
  await DebateService.addComment({ ...dto, ipHash: req.ip });
  return { ok: true };
};
