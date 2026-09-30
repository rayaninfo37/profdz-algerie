import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfill() {
  console.log('🔄 Starting Teacher Pricing & Taxonomy Backfill...');

  const teachers = await prisma.teacherProfile.findMany({
    select: {
      id: true,
      pricingInfo: true,
      priceMin: true,
      priceMax: true,
      subjects: true,
      educationLevels: true,
    },
  });

  console.log(`Found ${teachers.length} teachers to inspect.`);
  let updatedCount = 0;

  for (const t of teachers) {
    const dataToUpdate = {};

    // 1. Backfill priceMin / priceMax if not set
    if (t.priceMin === null || t.priceMax === null) {
      let min = 1500;
      let max = 2500;

      if (t.pricingInfo) {
        // Extract all numbers from pricingInfo string (e.g. "1700 دج / حصة" or "1500 - 2500")
        const matches = t.pricingInfo.match(/\d+/g);
        if (matches && matches.length === 1) {
          min = parseInt(matches[0], 10);
          max = min;
        } else if (matches && matches.length >= 2) {
          min = Math.min(parseInt(matches[0], 10), parseInt(matches[1], 10));
          max = Math.max(parseInt(matches[0], 10), parseInt(matches[1], 10));
        }
      }

      dataToUpdate.priceMin = min;
      dataToUpdate.priceMax = max;
      if (!t.pricingInfo) {
        dataToUpdate.pricingInfo = min === max ? `${min} دج / حصة` : `من ${min} إلى ${max} دج / حصة`;
      }
    }

    // 2. Ensure subjects & educationLevels are valid JSON arrays
    let subjects = [];
    try {
      subjects = JSON.parse(t.subjects || '[]');
      if (!Array.isArray(subjects)) subjects = [String(subjects)];
    } catch {
      subjects = [t.subjects].filter(Boolean);
    }
    if (subjects.length === 0) subjects = ['الرياضيات (Mathematics)'];

    let levels = [];
    try {
      levels = JSON.parse(t.educationLevels || '[]');
      if (!Array.isArray(levels)) levels = [String(levels)];
    } catch {
      levels = [t.educationLevels].filter(Boolean);
    }
    if (levels.length === 0) levels = ['3AS بكالوريا', 'الطور الثانوي'];

    if (Object.keys(dataToUpdate).length > 0) {
      await prisma.teacherProfile.update({
        where: { id: t.id },
        data: dataToUpdate,
      });
      updatedCount++;
    }
  }

  console.log(`✅ Successfully backfilled ${updatedCount} teachers with structured pricing and taxonomy.`);
  await prisma.$disconnect();
}

backfill().catch((err) => {
  console.error('❌ Backfill error:', err);
  process.exit(1);
});
