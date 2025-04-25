import { prisma } from '@/libs/prisma';
import { CreateCategoryBody } from '@/schemas/category.schema';

export const createCategoryRepo = async (payload: CreateCategoryBody) => {
  return prisma.category.create({
    data: {
      name: payload.name,
      slug: payload.slug,
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });
};
