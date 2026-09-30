import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminGuard';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const items = await prisma.taxonomyItem.findMany({
      where: {
        isActive: true,
        ...(type ? { type } : {}),
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch taxonomy' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdmin();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, code, nameAr, nameFr, nameEn, targetPersona, order, isActive } = body;

    if (!type || !code || !nameAr) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const item = await prisma.taxonomyItem.upsert({
      where: { code },
      update: {
        type,
        nameAr,
        nameFr: nameFr || nameAr,
        nameEn: nameEn || nameAr,
        targetPersona: targetPersona || 'ALL',
        order: Number(order) || 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
      create: {
        type,
        code,
        nameAr,
        nameFr: nameFr || nameAr,
        nameEn: nameEn || nameAr,
        targetPersona: targetPersona || 'ALL',
        order: Number(order) || 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error('Error saving taxonomy item:', error);
    return NextResponse.json({ error: 'Failed to save taxonomy' }, { status: 500 });
  }
}
