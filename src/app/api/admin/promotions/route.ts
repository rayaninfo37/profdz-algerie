import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminGuard';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const adminUser = await requireAdmin();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const promotions = await prisma.promotedContent.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ promotions });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch promotions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdmin();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, placement, bannerUrl, targetUrl, sponsorName, startDate, endDate, isActive } = body;

    if (!title || !placement) {
      return NextResponse.json({ error: 'Title and placement are required' }, { status: 400 });
    }

    const promotion = await prisma.promotedContent.create({
      data: {
        type: 'SPONSOR',
        titleAr: title,
        titleFr: title,
        titleEn: title,
        imageUrl: bannerUrl || '/logok.png',
        destinationUrl: targetUrl || '#',
        entityName: sponsorName || 'KRYTY Sponsor',
        placement: placement || 'HOMEPAGE',
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 86400000),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    return NextResponse.json({ success: true, promotion });
  } catch (error) {
    console.error('Error creating promotion:', error);
    return NextResponse.json({ error: 'Failed to create promotion' }, { status: 500 });
  }
}
