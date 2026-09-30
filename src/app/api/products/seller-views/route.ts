import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getProductVisitors } from '@/lib/visitorTracking';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    // Fetch products owned by user (creatorId can be user.id or teacherProfile.id)
    const teacher = await prisma.teacherProfile.findUnique({ where: { userId: user.id } });
    const creatorIds = [user.id];
    if (teacher) creatorIds.push(teacher.id);

    const userProducts = await prisma.product.findMany({
      where: { creatorId: { in: creatorIds } },
      select: { id: true, title: true, slug: true },
    });

    if (userProducts.length === 0) {
      return NextResponse.json({ products: [], visitors: [], totalViews: 0, uniqueViewersCount: 0 });
    }

    const selectedProductId = productId || userProducts[0].id;
    const isOwner = userProducts.some((p) => p.id === selectedProductId);

    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await getProductVisitors(selectedProductId, 20);

    return NextResponse.json({
      products: userProducts,
      selectedProductId,
      visitors: result.visitors,
      totalViews: result.totalViews,
      uniqueViewersCount: result.uniqueViewersCount,
    });
  } catch (error) {
    console.error('Error fetching product visitors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
