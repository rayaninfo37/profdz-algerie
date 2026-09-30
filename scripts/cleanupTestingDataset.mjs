import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== STARTING DETERMINISTIC SYNTHETIC TEST DATA CLEANUP ===');

  const beforeTotal = await prisma.user.count();
  const syntheticUsers = await prisma.user.findMany({
    where: {
      OR: [
        { isTestData: true },
        { email: { contains: '@synthetic-test.kryty.dz' } },
      ],
    },
    select: { id: true, email: true },
  });

  console.log(`Found ${syntheticUsers.length} synthetic user records to delete.`);
  console.log(`Total users before cleanup: ${beforeTotal}`);

  if (syntheticUsers.length > 0) {
    const userIds = syntheticUsers.map((u) => u.id);

    // Prisma cascades User relations (TeacherProfile, StudentProfile, etc.)
    const deleted = await prisma.user.deleteMany({
      where: {
        id: { in: userIds },
      },
    });

    console.log(`Deleted ${deleted.count} synthetic user records.`);
  }

  const afterTotal = await prisma.user.count();
  const remainingSynthetic = await prisma.user.count({
    where: {
      OR: [
        { isTestData: true },
        { email: { contains: '@synthetic-test.kryty.dz' } },
      ],
    },
  });

  console.log(`Total users after cleanup: ${afterTotal}`);
  console.log(`Remaining synthetic users: ${remainingSynthetic}`);

  if (remainingSynthetic === 0) {
    console.log('✅ SYNTHETIC CLEANUP SUCCESSFUL: Zero synthetic data remains.');
  } else {
    throw new Error('Cleanup failed: some synthetic records remain.');
  }
}

main()
  .catch((e) => {
    console.error('Cleanup error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
