import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const seedCategories = [
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

async function main() {
  for (const { name, slug } of seedCategories) {
    await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
  }
  console.log(`✅  Seeded ${seedCategories.length} categories`);
}

main().catch(e => {
  console.error('❌  Category seeding failed', e);
  process.exit(1);
});

async function run() {
  try {
    await main();
  } finally {
    await prisma.$disconnect();
  }
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
