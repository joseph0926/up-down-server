import { z } from 'zod';

export const paginated = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    size: z.number().int().positive(),
  });

export const apiSuccess = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string(),
  });
export type ApiSuccess<T extends z.ZodTypeAny> = z.infer<ReturnType<typeof apiSuccess<T>>>;

export const failSchema = z.object({
  success: z.literal(false),
  code: z.string(),
  message: z.string(),
  data: z.null(),
});
export type ApiFail = z.infer<typeof failSchema>;
