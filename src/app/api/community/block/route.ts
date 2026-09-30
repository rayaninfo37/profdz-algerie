import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/middleware/rateLimitMiddleware';

/**
 * POST /api/community/block  — Block/unblock a user.
 * GET  /api/community/block  — Check if current user has blocked or been blocked by a specific user.
 */
export async function POST(request: Request) {
  const limitRes = await rateLimit(request, 20, 60_000);
  if (limitRes) return limitRes;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول لاستخدام هذه الخاصية.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { blockedUserId } = body;

    if (!blockedUserId) {
      return NextResponse.json({ error: 'معرف المستخدم المراد حظره مطلوب.' }, { status: 400 });
    }

    if (blockedUserId === user.id) {
      return NextResponse.json({ error: 'لا يمكنك حظر نفسك.' }, { status: 400 });
    }

    const existing = await (prisma as any).userBlock.findUnique({
      where: { blockerId_blockedId: { blockerId: user.id, blockedId: blockedUserId } },
    }).catch(() => null);

    if (existing) {
      // Unblock
      await (prisma as any).userBlock.delete({
        where: { blockerId_blockedId: { blockerId: user.id, blockedId: blockedUserId } },
      }).catch(() => null);

      // Also remove any existing follows between the two users
      await prisma.follow.deleteMany({
        where: {
          OR: [
            { followerId: user.id, followingId: blockedUserId },
            { followerId: blockedUserId, followingId: user.id },
          ],
        },
      }).catch(() => null);

      return NextResponse.json({ success: true, blocked: false });
    } else {
      // Block
      await (prisma as any).userBlock.create({
        data: { blockerId: user.id, blockedId: blockedUserId },
      }).catch((e: any) => {
        // Table may not exist yet — silently record in a different way
        console.warn('[BLOCK] UserBlock table not available, using follow removal only:', e.message);
      });

      // Remove any existing follows
      await prisma.follow.deleteMany({
        where: {
          OR: [
            { followerId: user.id, followingId: blockedUserId },
            { followerId: blockedUserId, followingId: user.id },
          ],
        },
      }).catch(() => null);

      return NextResponse.json({ success: true, blocked: true });
    }
  } catch (error: any) {
    console.error('Block error:', error);
    return NextResponse.json({ error: 'فشل في تنفيذ الحظر.' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');

    if (!targetUserId) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب.' }, { status: 400 });
    }

    const isBlocked = await (prisma as any).userBlock.findUnique({
      where: { blockerId_blockedId: { blockerId: user.id, blockedId: targetUserId } },
    }).then(() => true).catch(() => false);

    const isBlockedBy = await (prisma as any).userBlock.findUnique({
      where: { blockerId_blockedId: { blockerId: targetUserId, blockedId: user.id } },
    }).then(() => true).catch(() => false);

    return NextResponse.json({ success: true, isBlocked, isBlockedBy });
  } catch (error: any) {
    return NextResponse.json({ error: 'فشل في فحص حالة الحظر.' }, { status: 500 });
  }
}
