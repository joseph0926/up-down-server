import { z } from 'zod';

export const ErrorCode = z.enum(['VALIDATION', 'NOT_FOUND', 'FORBIDDEN', 'CONFLICT', 'INTERNAL']);
export type ErrorCode = z.infer<typeof ErrorCode>;

export const apiFail = z.object({
  success: z.literal(false),
  code: ErrorCode,
  message: z.string(),
  data: z.null(),
});
export type ApiFail = z.infer<typeof apiFail>;

export const apiSuccess = <T extends z.ZodTypeAny>(payload: T) =>
  z.object({
    success: z.literal(true),
    message: z.string().default(''),
    data: payload,
  });
export type ApiSuccess<T extends z.ZodTypeAny> = z.infer<ReturnType<typeof apiSuccess<T>>>;

export const apiResponse = <T extends z.ZodTypeAny>(payload: T) =>
  z.union([apiSuccess(payload), apiFail]);
export type ApiResponse<T extends z.ZodTypeAny> = z.infer<ReturnType<typeof apiResponse<T>>>;

export const paginated = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    size: z.number().int().positive(),
  });
export type Paginated<T extends z.ZodTypeAny> = z.infer<ReturnType<typeof paginated<T>>>;

export const cursorList = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
  });
export type CursorList<T extends z.ZodTypeAny> = z.infer<ReturnType<typeof cursorList<T>>>;
