const { UP_REDIS_REST_URL, UP_REDIS_REST_TOKEN } = process.env;
if (!UP_REDIS_REST_URL || !UP_REDIS_REST_TOKEN) {
  throw new Error('환경 변수가 없습니다');
}

await fetch(`${UP_REDIS_REST_URL}/FLUSHALL`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${UP_REDIS_REST_TOKEN}` },
});
console.log('Upstash Redis FLUSHALL 완료');

export {};
