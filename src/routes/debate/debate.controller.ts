import { FastifyRequest } from 'fastify';

import { DebateService } from '@/services/debate.service';

import {
  CreateDebateBody,
  DebateIdParam,
  DebateListQuery,
  ResCreateDebate,
  ResDebateDetail,
  ResDebateList,
} from './debate.schema.js';

export const getDebateList = async (req: FastifyRequest) => {
  const { sort, limit, cursor } = DebateListQuery.parse(req.query);
  const data = await DebateService.getDebateList(sort, limit, cursor);
  return ResDebateList.parse(data);
};

export const getDebate = async (req: FastifyRequest) => {
  const { id } = DebateIdParam.parse(req.params);
  const debate = await DebateService.getById(id);
  return ResDebateDetail.parse(debate);
};

export const createDebate = async (req: FastifyRequest) => {
  const dto = CreateDebateBody.parse(req.body);
  const debate = await DebateService.create(dto);
  return ResCreateDebate.parse(debate);
};
