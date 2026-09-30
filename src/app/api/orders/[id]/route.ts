import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/orders/[id]
 * Returns a single order detail. Marks as READ on first access.
 * IDOR: teacher can only access their own orders (verified against session, not URL).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { id } = await params;

    const order = await prisma.productOrder.findUnique({ where: { id } });

    if (!order) {
      return NextResponse.json({ error: 'الطلب غير موجود.' }, { status: 404 });
    }

    // ── IDOR check: teacher can only access their own orders ──────────────────
    if (user.role === 'TEACHER') {
      const teacherProfile = user.teacherProfile;
      if (!teacherProfile || order.teacherProfileId !== teacherProfile.id) {
        // Return 403 not 404 — don't leak existence of other orders
        return NextResponse.json({ error: 'غير مصرح.' }, { status: 403 });
      }
    } else if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    // ── Mark as READ if currently NEW ─────────────────────────────────────────
    if (order.status === 'NEW') {
      await prisma.productOrder.update({
        where: { id },
        data: { status: 'READ', readAt: new Date() },
      });
    }

    // ── Parse JSON fields for clean response ──────────────────────────────────
    let customFields: Record<string, string> = {};
    let formSchemaSnapshot: unknown[] = [];
    try { customFields = JSON.parse(order.customFields); } catch { /* ok */ }
    try { formSchemaSnapshot = JSON.parse(order.formSchemaSnapshot); } catch { /* ok */ }

    return NextResponse.json({
      order: {
        id: order.id,
        productId: order.productId,
        teacherProfileId: order.teacherProfileId,
        productTitleSnapshot: order.productTitleSnapshot,
        productPriceSnapshot: order.productPriceSnapshot,
        teacherNameSnapshot: order.teacherNameSnapshot,
        firstName: order.firstName,
        lastName: order.lastName,
        phone: order.phone,
        customFields,
        formSchemaSnapshot,
        status: order.status === 'NEW' ? 'READ' : order.status,
        readAt: order.readAt ?? new Date(),
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('[ORDER GET]', error?.message);
    return NextResponse.json({ error: 'Failed to fetch order.' }, { status: 500 });
  }
}

/**
 * PATCH /api/orders/[id]
 * Allows teacher (owner) or admin to update order status.
 * IDOR protected via session ownership check.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { status } = body as { status?: string };

    const order = await prisma.productOrder.findUnique({ where: { id } });
    if (!order) return NextResponse.json({ error: 'الطلب غير موجود.' }, { status: 404 });

    // ── IDOR check ────────────────────────────────────────────────────────────
    if (user.role === 'TEACHER') {
      const teacherProfile = user.teacherProfile;
      if (!teacherProfile || order.teacherProfileId !== teacherProfile.id) {
        return NextResponse.json({ error: 'غير مصرح.' }, { status: 403 });
      }
      // Frozen teachers can still read but not mutate
      if (user.isFrozen) {
        return NextResponse.json({ error: 'حسابك مجمد. لا يمكن تعديل الطلبات.' }, { status: 403 });
      }
    } else if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    const ALLOWED_STATUSES = ['NEW', 'READ'];
    if (status && !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'حالة غير مقبولة.' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (status) {
      updateData.status = status;
      if (status === 'READ' && !order.readAt) updateData.readAt = new Date();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: true, order }); // nothing to update
    }

    const updated = await prisma.productOrder.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    console.error('[ORDER PATCH]', error?.message);
    return NextResponse.json({ error: 'Failed to update order.' }, { status: 500 });
  }
}
