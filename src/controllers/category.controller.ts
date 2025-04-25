import { FastifyError } from 'fastify';

import { createCategoryRepo, getAllCategoriesRepo } from '@/repositories/category.repo';
import {
  CreateCategoryBody,
  CreateCategorySuccess,
  getAllCategorySuccessSchema,
} from '@/schemas/category.schema';

export const createCategoryController = async (
  payload: CreateCategoryBody,
): Promise<CreateCategorySuccess> => {
  try {
    const category = await createCategoryRepo(payload);
    return {
      success: true,
      data: category,
      message: '카테고리가 생성되었습니다.',
    };
  } catch (err) {
    const e = err as FastifyError & { code?: string };
    if (e.code === 'P2002') {
      throw Object.assign(e, {
        message: 'CATEGORY_DUPLICATE',
      });
    }
    throw e;
  }
};

export const getAllCategoriesController = async () => {
  const categories = await getAllCategoriesRepo();
  return getAllCategorySuccessSchema.parse({
    success: true,
    data: categories,
    message: '',
  });
};
