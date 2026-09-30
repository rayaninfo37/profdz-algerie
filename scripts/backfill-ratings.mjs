#!/usr/bin/env node
/**
 * backfill-ratings.mjs
 * 
 * Iterates all TeacherProfile records, aggregates their PUBLISHED reviews,
 * and updates the denormalized ratingAverage + reviewCount fields.
 * 
 * Usage: node scripts/backfill-ratings.mjs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[backfill-ratings] Starting...');

  const teachers = await prisma.teacherProfile.findMany({
    select: { id: true },
  });

  console.log(`[backfill-ratings] Found ${teachers.length} teacher profiles.`);

  let updated = 0;
  for (const teacher of teachers) {
    const agg = await prisma.review.aggregate({
      where: {
        targetId: teacher.id,
        targetType: 'TEACHER',
        status: 'PUBLISHED',
      },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const ratingAverage = agg._avg.rating ?? 0;
    const reviewCount = agg._count.rating;

    await prisma.teacherProfile.update({
      where: { id: teacher.id },
      data: { ratingAverage, reviewCount },
    });

    updated++;
    if (updated % 50 === 0 || updated === teachers.length) {
      console.log(`[backfill-ratings] Progress: ${updated}/${teachers.length}`);
    }
  }

  console.log(`[backfill-ratings] Done. Updated ${updated} teacher profiles.`);
}

main()
  .catch((e) => {
    console.error('[backfill-ratings] Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
