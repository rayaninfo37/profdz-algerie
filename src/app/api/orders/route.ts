import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/orders
 * TEACHER: returns own orders only — ownership from session, never from query params.
 * ADMIN: returns all orders with optional filters.
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const take = Math.min(Math.max(parseInt(searchParams.get('take') || '50'), 1), 100);
    const skip = Math.max(parseInt(searchParams.get('skip') || '0'), 0);
    const statusFilter = searchParams.get('status') || undefined;

    // ── ADMIN: can see all orders with optional filters ───────────────────────
    if (user.role === 'ADMIN') {
      const teacherProfileId = searchParams.get('teacherProfileId') || undefined;

      const where: Record<string, unknown> = {};
      if (teacherProfileId) where.teacherProfileId = teacherProfileId;
      if (statusFilter) where.status = statusFilter;

      const [total, orders] = await Promise.all([
        prisma.productOrder.count({ where }),
        prisma.productOrder.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take,
          skip,
          select: {
            id: true,
            teacherProfileId: true,
            productId: true,
            productTitleSnapshot: true,
            productPriceSnapshot: true,
            teacherNameSnapshot: true,
            firstName: true,
            lastName: true,
            phone: true,
            status: true,
            readAt: true,
            createdAt: true,
          },
        }),
      ]);

      return NextResponse.json({ orders, total });
    }

    // ── TEACHER: ownership strictly from session ───────────────────────────────
    if (user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    const teacherProfile = user.teacherProfile;
    if (!teacherProfile) {
      return NextResponse.json({ orders: [], total: 0, newCount: 0 });
    }

    const where: Record<string, unknown> = {
      teacherProfileId: teacherProfile.id, // ALWAYS from session — never overridable
    };
    if (statusFilter) where.status = statusFilter;

    const [total, newCount, orders] = await Promise.all([
      prisma.productOrder.count({ where }),
      prisma.productOrder.count({
        where: { teacherProfileId: teacherProfile.id, status: 'NEW' },
      }),
      prisma.productOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
        select: {
          id: true,
          productId: true,
          productTitleSnapshot: true,
          productPriceSnapshot: true,
          firstName: true,
          lastName: true,
          phone: true,
          status: true,
          readAt: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({ orders, total, newCount });
  } catch (error: any) {
    console.error('[ORDERS GET]', error?.message);
    return NextResponse.json({ error: 'Failed to fetch orders.' }, { status: 500 });
  }
}
