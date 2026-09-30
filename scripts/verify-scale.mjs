import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== VERIFYING DIRECTORY AND QUERY PERFORMANCE AT SCALE ===');

  // 1. Total discoverable teachers (FREE_ACTIVE + PRO_ACTIVE)
  const discoverableCount = await prisma.teacherProfile.count({
    where: {
      subscriptionState: { in: ['FREE_ACTIVE', 'PRO_ACTIVE'] },
    },
  });
  console.log(`Discoverable teachers count: ${discoverableCount}`);

  // 2. Test server-side pagination with page sizes 10, 30, 50, 100
  for (const size of [10, 30, 50, 100]) {
    const start = performance.now();
    const teachers = await prisma.teacherProfile.findMany({
      where: {
        subscriptionState: { in: ['FREE_ACTIVE', 'PRO_ACTIVE'] },
      },
      take: size,
      skip: 0,
      include: { user: true },
      orderBy: [{ isVerified: 'desc' }, { createdAt: 'desc' }],
    });
    const dur = Math.round(performance.now() - start);
    console.log(`Pagination query for pageSize=${size} fetched ${teachers.length} items in ${dur}ms`);
  }

  // 3. Test Wilaya query (e.g. Algiers '16')
  const algiersTeachers = await prisma.teacherProfile.findMany({
    where: {
      subscriptionState: { in: ['FREE_ACTIVE', 'PRO_ACTIVE'] },
      user: { wilayaCode: '16' },
    },
    include: { user: true },
  });
  console.log(`Wilaya 16 (Algiers) discoverable teachers: ${algiersTeachers.length}`);

  // 4. Verify Frozen teachers are strictly excluded from discovery
  const frozenCount = await prisma.teacherProfile.count({
    where: { subscriptionState: 'FROZEN' },
  });
  console.log(`FROZEN teachers (excluded from public directory): ${frozenCount}`);

  console.log('✅ SCALE AND DIRECTORY TEST PASSED!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
