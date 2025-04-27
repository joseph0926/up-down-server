import { PrismaClient, Status } from '@prisma/client';

import { redis } from '../src/libs/redis/index.js';
import { keyComments, keyParticipants, keyViews, keyVotes } from '../src/libs/redis/keys.js';

const prisma = new PrismaClient();

const categories = [
  { name: '정치', slug: 'politics' },
  { name: '사회', slug: 'society' },
  { name: '경제', slug: 'economy' },
  { name: '과학·기술', slug: 'tech' },
  { name: '문화·연예', slug: 'culture' },
  { name: '스포츠', slug: 'sports' },
  { name: '환경·기후', slug: 'environment' },
  { name: '교육', slug: 'education' },
  { name: '국제', slug: 'world' },
  { name: '생활·건강', slug: 'life-health' },
];

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

const SUBJECTS = [
  'AI 추천 알고리즘',
  '기본소득',
  '탄소세 확대',
  '스마트폰 사용 제한',
  'BTS 병역 특례',
  'VAR 판독',
  '원자력 발전 확대',
  '전기차 충전 인프라',
  '온라인 수업 확대',
  '대마초 합법화',
  '로봇세 도입',
  '거대 플랫폼 규제 강화',
  '부유세 신설',
  '주 4일제',
  '치명적 감염병 전면 봉쇄',
  '꼬마빌딩 공시가 상향',
  '게임 셧다운제 폐지',
  '동물원 존폐',
  '우주 관광 상업화',
  '유전자 편집 아기 허용',
];

const ENDINGS = ['찬성 vs. 반대?', '도입이 필요할까?', '효과 있을까?', '형평성 논란?', '장단점은?'];

const makeTitle = () => `${randPick(SUBJECTS)}, ${randPick(ENDINGS)}`;
const makeContent = t => `${t}에 대한 여러분의 생각은…`;
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randPick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

async function main() {
  await Promise.all(
    categories.map(({ name, slug }) =>
      prisma.category.upsert({ where: { slug }, update: {}, create: { name, slug } }),
    ),
  );
  console.log(`✅  Seeded ${categories.length} categories`);

  const TOTAL_DEBATES = 50;
  const now = new Date();

  for (let i = 0; i < TOTAL_DEBATES; i++) {
    const cat = categories[i % categories.length];
    const thumbId = thumbIds[i % thumbIds.length];
    const smallId = smallIds[i % smallIds.length];

    const isClosed = i % 4 === 0;
    const isUpcoming = !isClosed && i % 5 === 0;
    const deadline = new Date(now);
    const startAt = isUpcoming ? new Date(now.getTime() + rand(1, 5) * 86_400_000) : new Date(now);

    let status: Status = Status.ongoing;
    let closedAt: Date | null = null;

    if (isClosed) {
      deadline.setDate(now.getDate() - rand(1, 7));
      status = Status.closed;
      closedAt = new Date(deadline);
    } else if (isUpcoming) {
      deadline.setDate(startAt.getDate() + rand(3, 10));
      status = Status.upcoming;
    } else {
      deadline.setDate(now.getDate() + rand(1, 14));
    }

    const pro = rand(0, 800);
    const con = rand(0, 800);
    const views = rand(100, 5_000);
    const cmts = rand(0, 200);
    const parts = rand(0, 300);

    const debate = await prisma.debate.create({
      data: {
        title: makeTitle(),
        content: makeContent(makeTitle()),
        startAt: status === Status.closed ? null : startAt,
        deadline,
        status,
        closedAt,
        proCount: pro,
        conCount: con,
        commentCount: cmts,
        participantCount: parts,
        viewCount: views,
        hotScore: 0,
        thumbUrl: cdn(thumbId),
        smallUrl: cdn(smallId),
        category: { connect: { slug: cat.slug } },
      },
    });

    if (status !== Status.closed) {
      const exp = Math.floor(deadline.getTime() / 1000);

      await redis
        .multi()
        .set(keyViews(debate.id), views, 'EXAT', exp)
        .set(keyComments(debate.id), cmts, 'EXAT', exp)
        .hset(keyVotes(debate.id), { pro, con })
        .sadd(
          keyParticipants(debate.id),
          ...Array(parts)
            .fill('')
            .map(() => `ip-${rand(1, 1e5)}`),
        )
        .zadd('debate:hot', 0, debate.id)
        .exec();
    }
  }

  console.log(`✅  Seeded ${TOTAL_DEBATES} debates`);
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
