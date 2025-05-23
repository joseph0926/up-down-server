import crypto from 'node:crypto';

import { faker } from '@faker-js/faker/locale/ko';
import { PrismaClient, Side, Status } from '@prisma/client';

import { redis } from '../src/libs/redis/index.js';
import { keyComments, keyParticipants, keyViews, keyVotes } from '../src/libs/redis/keys.js';

const prisma = new PrismaClient();

const thumbIds = [
  'sergio-rota-u-FrtCVeVSY-unsplash_l5js17',
  'ale-4VMrv2rTdrc-unsplash_omoenm',
  'koala-z-N8biUPLS6_I-unsplash_fyset9',
  'ale-4VMrv2rTdrc-unsplash_hnjg57',
  'mattia-bericchia-s_3A1LeqYU8-unsplash_gmgmhs',
  'paul-muller-74TNu-8XSIE-unsplash_siscac',
];

const smallIds = [
  'alex-suprun-ZHvM3XIOHoE-unsplash_mqmemv',
  'leio-mclaren-L2dTmhQzx4Q-unsplash_ncdypu',
  'aiony-haust-3TLl_97HNJo-unsplash_ktpoyv',
  'christopher-campbell-rDEOVtE7vOs-unsplash_nkreut',
  'jake-nackos-IF9TK5Uy-KI-unsplash_psvaaw',
  'diego-hernandez-MSepzbKFz10-unsplash_b1g4ho',
];

const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
const cdn = (id: string) => `https://res.cloudinary.com/${cloudName}/image/upload/${id}.jpg`;

const categories = [
  { name: '정치', slug: 'politics' },
  { name: '사회', slug: 'society' },
  { name: '경제', slug: 'economy' },
  { name: '과학·기술', slug: 'tech' },
  { name: '문화·연예', slug: 'culture' },
];
const SUBJECTS = [
  'AI 추천 알고리즘',
  '기본소득',
  '탄소세 확대',
  '스마트폰 사용 제한',
  'BTS 병역 특례',
  '원자력 발전 확대',
  '주 4일제',
  '대마초 합법화',
];
const ENDINGS = ['찬성 vs. 반대?', '도입이 필요할까?', '효과 있을까?'];

const rand = (min: number, max: number) => faker.number.int({ min, max });
const pick = <T>(arr: T[]) => faker.helpers.arrayElement(arr);

const htmlContent = (title: string) => `
<h2>${title}</h2>
<h3>배경</h3>
<p>${faker.lorem.paragraph()}</p>

<h3>찬성 의견</h3>
<ul>
  <li>${faker.lorem.sentence()}</li>
  <li>${faker.lorem.sentence()}</li>
</ul>

<h3>반대 의견</h3>
<ol>
  <li>${faker.lorem.sentence()}</li>
  <li>${faker.lorem.sentence()}</li>
</ol>

<blockquote><strong>당신의 생각은?</strong> 댓글로 자유롭게 토론해 주세요.</blockquote>
`;

const randomIp = () => `${rand(1, 255)}.${rand(0, 255)}.${rand(0, 255)}.${rand(0, 255)}`;
export const hashIp = (ip: string) =>
  crypto
    .createHash('sha256')
    .update(`${ip}56a62b815b7a6486743410ed87225bc519567e5049fdcff04c0c3ed269afc1b1`)
    .digest('hex');

async function main() {
  console.time('seed');

  await Promise.all(
    categories.map(c => prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c })),
  );

  for (let i = 0; i < 50; i++) {
    const cat = pick(categories);
    const thumbId = thumbIds[i % thumbIds.length];
    const smallId = smallIds[i % smallIds.length];
    const now = new Date();
    const isUpcoming = i % 7 === 0;
    const isClosed = i % 5 === 0 && !isUpcoming;

    const title = `${pick(SUBJECTS)}, ${pick(ENDINGS)}`;
    const deadline = faker.date.soon({ days: rand(3, 14) });
    const startAt = isUpcoming ? faker.date.soon({ days: rand(1, 5) }) : now;
    const status = isClosed ? Status.closed : isUpcoming ? Status.upcoming : Status.ongoing;
    const closedAt = isClosed ? faker.date.recent({ days: 3 }) : null;

    const commentN = rand(0, 25);
    const comments = Array.from({ length: commentN }).map(() => {
      const ip = randomIp();
      return {
        nickname: faker.internet.username(),
        content: faker.lorem.sentences({ min: 1, max: 3 }),
        side: pick(['PRO', 'CON']) as Side,
        likes: rand(0, 20),
        ipHash: hashIp(ip),
      };
    });
    const proCnt = comments.filter(c => c.side === 'PRO').length;
    const conCnt = commentN - proCnt;

    const debate = await prisma.debate.create({
      data: {
        title,
        content: htmlContent(title),
        status,
        startAt: status === Status.closed ? null : startAt,
        deadline,
        closedAt,
        proCount: proCnt,
        conCount: conCnt,
        commentCount: commentN,
        participantCount: commentN + rand(0, 100),
        viewCount: rand(150, 3000),
        hotScore: 0,
        thumbUrl: cdn(thumbId),
        smallUrl: cdn(smallId),
        category: { connect: { slug: cat.slug } },
      },
    });

    if (commentN) {
      await prisma.comment.createMany({
        data: comments.map(c => ({ ...c, debateId: debate.id })),
      });
    }

    if (status !== Status.closed) {
      const exp = Math.floor(deadline.getTime() / 1000);
      await redis
        .multi()
        .set(keyViews(debate.id), rand(150, 3000), 'EXAT', exp)
        .set(keyComments(debate.id), commentN, 'EXAT', exp)
        .hset(keyVotes(debate.id), { pro: proCnt, con: conCnt })
        .sadd(
          keyParticipants(debate.id),
          ...Array(rand(20, 100))
            .fill('')
            .map(() => `ip-${rand(1, 1e6)}`),
        )
        .zadd('debate:hot', 0, debate.id)
        .exec();
    }
  }

  const keywords: { word: string; score: number }[] = [
    { word: '총선', score: rand(80, 150) },
    { word: '공매도', score: rand(40, 100) },
    { word: '주4일제', score: rand(30, 90) },
    { word: 'AI규제', score: rand(20, 70) },
    { word: '부동산', score: rand(10, 60) },
  ];

  const max = Math.max(...keywords.map(k => k.score)) || 1;

  const multi = redis.multi();
  keywords.forEach(k => {
    multi.zadd('live:kw', k.score, k.word);
    const idx = Math.round((k.score / max) * 100);
    multi.hset('live:kw:index', k.word, idx);
  });
  await multi.exec();

  console.timeEnd('seed');
  console.log('✅  All seed data inserted');
}

async function run() {
  try {
    await main();
  } catch (e) {
    console.error('❌  Seeding failed', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await redis.quit();
  }
}

run().catch(err => {
  console.error('❌  Seeding failed', err);
  process.exit(1);
});
