import { PrismaClient, Side } from '@prisma/client';

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

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const cdn = id => `https://res.cloudinary.com/${cloudName}/image/upload/${id}.jpg`;

const debates = [
  {
    title: 'AI 추천 알고리즘, 선거 여론에 영향 줄까?',
    categorySlug: 'tech',
    thumbId: thumbIds[0],
    smallId: smallIds[0],
  },
  {
    title: '기본소득 도입, 경제 활성화에 도움이 될까?',
    categorySlug: 'economy',
    thumbId: thumbIds[1],
    smallId: smallIds[1],
  },
  {
    title: '탄소세 확대, 환경 보호 vs. 서민 부담?',
    categorySlug: 'environment',
    thumbId: thumbIds[2],
    smallId: smallIds[2],
  },
  {
    title: '스마트폰 사용 제한, 학업 성취도 향상될까?',
    categorySlug: 'education',
    thumbId: thumbIds[3],
    smallId: smallIds[3],
  },
  {
    title: 'BTS 군면제, 문화적 파급효과 vs. 형평성 논란?',
    categorySlug: 'culture',
    thumbId: thumbIds[4],
    smallId: smallIds[4],
  },
  {
    title: 'VAR 판독 시간, 축구 경기 흐름을 망치는가?',
    categorySlug: 'sports',
    thumbId: thumbIds[5],
    smallId: smallIds[5],
  },
];

async function main() {
  await Promise.all(
    categories.map(({ name, slug }) =>
      prisma.category.upsert({
        where: { slug },
        update: {},
        create: { name, slug },
      }),
    ),
  );
  console.log(`✅  Seeded ${categories.length} categories`);

  for (const [i, d] of debates.entries()) {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + (i + 1));

    await prisma.debate.create({
      data: {
        title: d.title,
        content:
          d.content ?? '토론 내용을 자유롭게 입력하세요. 찬반 근거를 제시해 주시면 더욱 좋습니다.',
        deadline,
        thumbUrl: cdn(d.thumbId),
        smallUrl: cdn(d.smallId),
        category: { connect: { slug: d.categorySlug } },
      },
    });
  }
  console.log(`✅  Seeded ${debates.length} debates`);
}

async function run() {
  try {
    await main();
  } catch (e) {
    console.error('❌  Seeding failed', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
