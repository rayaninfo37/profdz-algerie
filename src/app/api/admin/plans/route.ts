import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminGuard';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const adminUser = await requireAdmin();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plans = await prisma.plan.findMany({
      orderBy: { priceDZD: 'asc' },
    });

    return NextResponse.json({ plans });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdmin();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code, nameAr, nameFr, nameEn, priceDZD, durationDays, descriptionAr, featuresJson, isActive } = body;

    if (!code || !nameAr || priceDZD === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const plan = await prisma.plan.upsert({
      where: { code },
      update: {
        nameAr,
        nameFr: nameFr || nameAr,
        nameEn: nameEn || nameAr,
        priceDZD: Number(priceDZD),
        durationDays: Number(durationDays) || 30,
        featuresJson: typeof featuresJson === 'string' ? featuresJson : JSON.stringify(featuresJson || []),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
      create: {
        code,
        targetPersona: 'TEACHER',
        nameAr,
        nameFr: nameFr || nameAr,
        nameEn: nameEn || nameAr,
        priceDZD: Number(priceDZD),
        durationDays: Number(durationDays) || 30,
        featuresJson: typeof featuresJson === 'string' ? featuresJson : JSON.stringify(featuresJson || []),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}
