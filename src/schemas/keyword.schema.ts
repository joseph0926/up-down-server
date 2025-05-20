import { z } from 'zod';

import { apiSuccess } from './common.schema.js';

export const LiveKeyword = z.object({
  word: z.string(),
  score: z.number().int().nonnegative(),
  index: z.number().int().min(0).max(100),
});
export type LiveKeyword = z.infer<typeof LiveKeyword>;

export const LiveKeywordSchema = z.object({
  keywords: z.array(LiveKeyword),
});
export const LiveKeywordResponse = apiSuccess(LiveKeywordSchema);
export type LiveKeywordResponse = z.infer<typeof LiveKeywordResponse>;
