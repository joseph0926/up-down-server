import 'dotenv/config';

import crypto from 'node:crypto';

import { faker } from '@faker-js/faker/locale/ko';
import { PrismaClient, Side, Status } from '@prisma/client';

import { redis } from '../src/libs/redis/index.js';
import { keyComments, keyParticipants, keyViews, keyVotes } from '../src/libs/redis/keys.js';

const prisma = new PrismaClient();

const rand = (min: number, max: number) => faker.number.int({ min, max });
const pick = <T>(arr: T[]) => faker.helpers.arrayElement(arr);

const hashIp = (ip: string) =>
  crypto
    .createHash('sha256')
    .update(`${ip}56a62b815b7a6486743410ed87225bc519567e5049fdcff04c0c3ed269afc1b1`)
    .digest('hex');

const randomIp = () => `${rand(1, 255)}.${rand(0, 255)}.${rand(0, 255)}.${rand(0, 255)}`;

const categories = [
  { name: '정치', slug: 'politics' },
  { name: '경제', slug: 'economy' },
  { name: '사회', slug: 'society' },
  { name: '과학·기술', slug: 'tech' },
  { name: '문화·연예', slug: 'culture' },
];

interface TopicDetail {
  subject: string;
  category: string;
  background: string;
  pros: string[];
  cons: string[];
}

const TOPIC_DETAILS: TopicDetail[] = [
  {
    subject: '기본소득 전국 도입',
    category: 'economy',
    background:
      '플랫폼 노동·AI 자동화 등 고용환경 변화로 소득 불안정 계층이 확대되면서, 모든 국민에게 일정 금액을 지급하는 기본소득 도입 논의가 재점화되고 있습니다.',
    pros: [
      '최소한의 인간다운 생활을 보장해 복지 사각지대를 해소할 수 있다.',
      '현행 복지 행정 비용을 줄여 행정 효율을 높일 수 있다.',
    ],
    cons: [
      '막대한 재정 부담으로 증세가 불가피하다.',
      '일자리 의욕을 저하시켜 노동 공급이 감소할 수 있다.',
    ],
  },
  {
    subject: '탄소세 단계적 확대',
    category: 'tech',
    background:
      '2050 탄소중립 목표 달성을 위해 에너지·제조 업계에 탄소세를 인상·확대 적용하는 법안이 추진되고 있습니다.',
    pros: [
      '기업들의 온실가스 감축 투자 동기를 강화할 수 있다.',
      '재원으로 신재생에너지 R&D를 지원해 장기적 경쟁력을 확보할 수 있다.',
    ],
    cons: [
      '생산비 상승이 소비자 물가 압력으로 전가될 우려가 크다.',
      '에너지 다소비 업종의 국제 경쟁력이 약화될 수 있다.',
    ],
  },
  {
    subject: '주 4일제 법제화',
    category: 'society',
    background:
      'MZ세대를 중심으로 워라밸 요구가 커지면서, 주 52시간제에 이어 주 4일제(주 32시간) 법제화가 공론화되고 있습니다.',
    pros: [
      '장시간 노동 문제를 개선해 삶의 질을 높일 수 있다.',
      '근로시간 단축으로 생산성을 오히려 높였다는 해외 사례가 있다.',
    ],
    cons: [
      '인력 운영이 어려운 중소기업의 비용 부담이 가중된다.',
      '임금 삭감 논란 및 고용 불안으로 이어질 수 있다.',
    ],
  },
  {
    subject: 'BTS 병역 특례',
    category: 'culture',
    background:
      'BTS가 세계적 K‑팝 위상을 높인 공로로 문화예술인 병역 특례 대상에 포함될지 여부를 두고 찬반 논쟁이 계속되고 있습니다.',
    pros: [
      '국위선양 효과가 크며, 일정 기간 활동 지속이 국가 브랜드 가치에 도움을 준다.',
      '예술·체육 요원처럼 대체 복무 형태로 공정하게 관리할 수 있다.',
    ],
    cons: [
      '형평성 논란으로 병역 의무의 보편적 가치가 훼손될 수 있다.',
      '대중문화 예술인 전반으로 특례 요구가 확산될 우려가 있다.',
    ],
  },
];

const ENDINGS = ['찬성 VS 반대?', '도입이 필요할까?', '효과 있을까?', '현실적인가?'];

const thumbIds = [
  'sergio-rota-u-FrtCVeVSY-unsplash_l5js17',
  'ale-4VMrv2rTdrc-unsplash_omoenm',
  'koala-z-N8biUPLS6_I-unsplash_fyset9',
  'mattia-bericchia-s_3A1LeqYU8-unsplash_gmgmhs',
  'paul-muller-74TNu-8XSIE-unsplash_siscac',
];
const smallIds = [
  'alex-suprun-ZHvM3XIOHoE-unsplash_mqmemv',
  'leio-mclaren-L2dTmhQzx4Q-unsplash_ncdypu',
  'aiony-haust-3TLl_97HNJo-unsplash_ktpoyv',
  'christopher-campbell-rDEOVtE7vOs-unsplash_nkreut',
  'jake-nackos-IF9TK5Uy-KI-unsplash_psvaaw',
];
const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? 'demo';
const cdn = (id: string) => `https://res.cloudinary.com/${cloudName}/image/upload/${id}.jpg`;

const htmlContent = (detail: TopicDetail) => {
  const { subject, background, pros, cons } = detail;
  return `
    <h2>${subject}</h2>
    <h3>배경</h3>
    <p>${background}</p>

    <h3>찬성 의견</h3>
    <ul>\n      <li>${pros[0]}</li>\n      <li>${pros[1]}</li>\n    </ul>

    <h3>반대 의견</h3>
    <ol>\n      <li>${cons[0]}</li>\n      <li>${cons[1]}</li>\n    </ol>

    <blockquote><strong>당신의 생각은?</strong> 댓글로 자유롭게 토론해 주세요.</blockquote>
  `;
};

async function main() {
  console.time('seed');

  await Promise.all(
    categories.map(c => prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c })),
  );

  const TOTAL_DEBATES = 60;
  for (let i = 0; i < TOTAL_DEBATES; i++) {
    const detail = TOPIC_DETAILS[i % TOPIC_DETAILS.length];
    const catSlug = detail.category;

    const now = new Date();
    const isUpcoming = i % 8 === 0;
    const isClosed = !isUpcoming && i % 6 === 0;
    const status: Status = isClosed ? Status.closed : isUpcoming ? Status.upcoming : Status.ongoing;

    const deadline = faker.date.soon({ days: rand(5, 21) });
    const startAt = isUpcoming ? faker.date.soon({ days: rand(1, 4) }) : now;
    const closedAt = isClosed ? faker.date.recent({ days: 3 }) : null;

    const thumbUrl = cdn(thumbIds[i % thumbIds.length]);
    const smallUrl = cdn(smallIds[i % smallIds.length]);

    const title = `${detail.subject}, ${pick(ENDINGS)}`;
    const content = htmlContent(detail);

    const commentN = rand(3, 40);
    const comments = Array.from({ length: commentN }).map(() => {
      const side = pick<Side>([Side.PRO, Side.CON]);
      const base = side === Side.PRO ? detail.pros : detail.cons;
      const sentence = pick(base);
      return {
        nickname: faker.internet.displayName(),
        content: `${sentence} ${faker.helpers.arrayElement(['라고 생각합니다.', '에 동의합니다.', '때문에 문제라고 봅니다.', '이 적절하다고 봅니다.'])}`,
        side,
        likes: rand(0, 25),
        ipHash: hashIp(randomIp()),
      };
    });

    const proCnt = comments.filter(c => c.side === Side.PRO).length;
    const conCnt = commentN - proCnt;

    const views = rand(200, 8000);
    const participants = commentN + rand(20, 150);

    const debate = await prisma.debate.create({
      data: {
        title,
        content,
        status,
        startAt: status === Status.closed ? null : startAt,
        deadline,
        closedAt,
        proCount: proCnt,
        conCount: conCnt,
        commentCount: commentN,
        participantCount: participants,
        viewCount: views,
        hotScore: 0,
        thumbUrl,
        smallUrl,
        category: { connect: { slug: catSlug } },
      },
    });

    if (commentN) {
      await prisma.comment.createMany({ data: comments.map(c => ({ ...c, debateId: debate.id })) });
    }

    if (status !== Status.closed) {
      const exp = Math.floor(deadline.getTime() / 1000);
      await redis
        .multi()
        .set(keyViews(debate.id), views, 'EXAT', exp)
        .set(keyComments(debate.id), commentN, 'EXAT', exp)
        .hset(keyVotes(debate.id), { pro: proCnt, con: conCnt })
        .sadd(
          keyParticipants(debate.id),
          ...Array(participants)
            .fill(0)
            .map(() => `ip-${rand(1, 1e8)}`),
        )
        .zadd('debate:hot', 0, debate.id)
        .exec();
    }
  }

  const keywords: { word: string; score: number }[] = [
    { word: '총선', score: rand(90, 180) },
    { word: '금리인상', score: rand(50, 120) },
    { word: '주4일제', score: rand(40, 110) },
    { word: 'AI규제', score: rand(30, 90) },
    { word: '부동산', score: rand(20, 80) },
  ];
  const multiKw = redis.multi();
  keywords.forEach(k => multiKw.zadd('live:kw', k.score, k.word));
  await multiKw.exec();

  console.timeEnd('seed');
  console.log('✅  Seed data successfully generated');
}

async function run() {
  try {
    await main();
  } catch (err) {
    console.error('❌  Seeding failed', err);
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
