import { redis } from '@/libs/redis/index';
import { LiveKeyword } from '@/schemas/keyword.schema';

const KEY_ZSET = 'live:kw';
const KEY_HASH = 'live:kw:index';

export async function getLiveKeywords(limit = 5): Promise<LiveKeyword[]> {
  const raw = await redis.zrevrange(KEY_ZSET, 0, limit - 1, 'WITHSCORES');
  if (raw.length === 0) return [];

  const words: string[] = [];
  const list: { word: string; score: number }[] = [];
  for (let i = 0; i < raw.length; i += 2) {
    const word = raw[i];
    const score = Number(raw[i + 1]);
    words.push(word);
    list.push({ word, score });
  }

  const idxArr = await redis.hmget(KEY_HASH, ...words);

  return list.map((kw, i) =>
    LiveKeyword.parse({
      ...kw,
      index: Number(idxArr[i] ?? 0),
    }),
  );
}
