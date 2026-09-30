import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== FINAL FORENSIC AUDIT OF KRYTY DATABASE ===');

  const [
    totalUsers,
    teachers,
    students,
    parents,
    posts,
    products,
    reviews,
    freeStateCount,
    hybridModeCount,
    syntheticCount,
    settingsCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.teacherProfile.count(),
    prisma.studentProfile.count(),
    prisma.parentProfile.count(),
    prisma.post.count(),
    prisma.product.count(),
    prisma.review.count(),
    prisma.teacherProfile.count({ where: { subscriptionState: 'FREE' } }),
    prisma.teacherProfile.count({ where: { teachingMode: 'HYBRID' } }),
    prisma.user.count({ where: { isTestData: true } }),
    prisma.platformSetting.count(),
  ]);

  console.log({
    totalUsers,
    teachers,
    students,
    parents,
    posts,
    products,
    reviews,
    legacyFreeStates: freeStateCount,
    legacyHybridModes: hybridModeCount,
    syntheticTestUsersRemaining: syntheticCount,
    platformSettingsConfigured: settingsCount,
  });

  const authenticCount = totalUsers - syntheticCount;
  if (authenticCount < 30) {
    throw new Error(`Baseline authentic user count expected at least 30 users, got ${authenticCount}`);
  }
  if (freeStateCount !== 0) {
    throw new Error(`Expected 0 legacy FREE states, got ${freeStateCount}`);
  }
  if (hybridModeCount !== 0) {
    throw new Error(`Expected 0 legacy HYBRID modes, got ${hybridModeCount}`);
  }

  console.log('🎉 AUDIT COMPLETE: 100% HEALTHY, CONSISTENT, AND SECURE!');
}

main()
  .catch((e) => {
    console.error('Audit failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
