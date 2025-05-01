import { FastifyRequest } from 'fastify';

import { DebateService } from '@/services/debate.service';

import {
  CreateDebate,
  CreateDebateBody,
  DebateDetail,
  DebateIdParam,
  DebateList,
  DebateListQuery,
} from './debate.schema.js';

export const getDebateList = async (req: FastifyRequest) => {
  const { sort, limit, cursor } = DebateListQuery.parse(req.query);
  const data = await DebateService.getDebateList(sort, limit, cursor);
  return DebateList.parse(data);
};

export const getDebate = async (req: FastifyRequest) => {
  const { id } = DebateIdParam.parse(req.params);
  const debate = await DebateService.getById(id);
  return DebateDetail.parse(debate);
};

export const createDebate = async (req: FastifyRequest) => {
  const dto = CreateDebateBody.parse(req.body);
  const debate = await DebateService.create(dto);
  return CreateDebate.parse(debate);
};
