import { z } from 'zod';

import { apiSuccess } from './common.schema.js';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createCategoryBodySchema = z.object({
  name: z.string().min(1).max(40),
  slug: z
    .string()
    .min(1)
    .max(40)
    .regex(slugRegex, {
      message: 'slug은 영문 소문자·숫자·하이픈만 사용할 수 있습니다.',
    })
    .transform(s => s.toLowerCase()),
});

export const createCategorySuccessSchema = apiSuccess(
  z.object({
    id: z.number().int().positive(),
    name: z.string(),
    slug: z.string(),
  }),
);

export type CreateCategoryBody = z.infer<typeof createCategoryBodySchema>;
export type CreateCategorySuccess = z.infer<typeof createCategorySuccessSchema>;

export const categoryDto = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  slug: z.string(),
});
export type CategoryDto = z.infer<typeof categoryDto>;

export const getAllCategorySuccessSchema = apiSuccess(z.array(categoryDto));
export type GetAllCategorySuccess = z.infer<typeof getAllCategorySuccessSchema>;
