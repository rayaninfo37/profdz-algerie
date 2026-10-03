import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@/types';
import { invalidateRankingCache } from '@/lib/ranking';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (user.role !== UserRole.ADMIN) return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const takeParam = searchParams.get('take');
    const skipParam = searchParams.get('skip');
    const take = takeParam ? Math.min(Math.max(parseInt(takeParam, 10) || 20, 1), 100) : 50;
    const skip = skipParam ? Math.max(parseInt(skipParam, 10) || 0, 0) : 0;

    const where: any = {};
    if (query) {
      where.OR = [
        { fullName: { contains: query } },
        { email: { contains: query } },
        { wilaya: { contains: query } },
      ];
    }
    if (role) where.role = role;
    if (status) {
      if (status === 'VERIFIED') {
        where.teacherProfile = { isVerified: true };
      } else if (status === 'FROZEN_ACCOUNT') {
        where.isFrozen = true;
      } else if (status === 'SOFT_DELETED') {
        where.softDeletedAt = { not: null };
      } else {
        where.teacherProfile = { subscriptionState: status };
      }
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          wilaya: true,
          createdAt: true,
          isFrozen: true,
          frozenAt: true,
          softDeletedAt: true,
          restorableUntil: true,
          firstLoginAt: true,
          teacherProfile: {
            select: {
              id: true,
              isVerified: true,
              subscriptionState: true,
              phone: true,
              whatsapp: true,
              telegram: true,
              website: true,
              bio: true,
              headline: true,
              sheetsDestination: true,
            },
          },
          institutionProfile: {
            select: { id: true, isVerified: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
    ]);

    return NextResponse.json({
      success: true,
      users,
      pagination: { total, take, skip, hasMore: skip + users.length < total },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch platform users' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (user.role !== UserRole.ADMIN) return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });

    const body = await request.json();
    const { targetUserId, action, newRole, subscriptionDays, adminNote } = body;

    if (!targetUserId) return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 });
    if (targetUserId === user.id) return NextResponse.json({ error: 'لا يمكنك تطبيق هذه العملية على حسابك الإداري.' }, { status: 400 });

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { teacherProfile: true },
    });
    if (!targetUser) return NextResponse.json({ error: 'المستخدم غير موجود.' }, { status: 404 });

    switch (action) {
      case 'UPDATE_ROLE': {
        if (!newRole) return NextResponse.json({ error: 'New role required' }, { status: 400 });
        await prisma.user.update({ where: { id: targetUserId }, data: { role: newRole } });
        await prisma.auditLog.create({
          data: { actorId: user.id, action: 'UPDATE_USER_ROLE', target: targetUserId, category: 'ADMIN', details: `Role → ${newRole}` },
        });
        return NextResponse.json({ success: true, message: 'تم تحديث الدور.' });
      }

      case 'FREEZE': {
        if (targetUser.softDeletedAt) return NextResponse.json({ error: 'لا يمكن تجميد حساب محذوف.' }, { status: 400 });
        await prisma.user.update({ where: { id: targetUserId }, data: { isFrozen: true, frozenAt: new Date() } });
        if (targetUser.teacherProfile) {
          await prisma.teacherProfile.update({
            where: { id: targetUser.teacherProfile.id },
            data: { subscriptionState: 'FROZEN' },
          });
        }
        invalidateRankingCache();
        revalidatePath('/teachers');
        revalidatePath('/');
        await prisma.auditLog.create({
          data: { actorId: user.id, action: 'FREEZE_USER', target: targetUserId, category: 'ADMIN', details: adminNote || 'Account frozen by admin' },
        });
        return NextResponse.json({ success: true, message: 'تم تجميد الحساب.' });
      }

      case 'UNFREEZE': {
        await prisma.user.update({ where: { id: targetUserId }, data: { isFrozen: false, frozenAt: null } });
        // Restore teacher to appropriate subscription state
        if (targetUser.teacherProfile) {
          const sub = await prisma.subscription.findFirst({
            where: { teacherId: targetUser.teacherProfile.id, status: 'ACTIVE' },
            orderBy: { expiresAt: 'desc' },
          });
          const now = new Date();
          const isProActive = sub && sub.expiresAt > now;

          let restoredState = 'FROZEN';
          if (isProActive) {
            restoredState = 'PRO_ACTIVE';
          } else {
            // Check if 30-day trial is still active
            const { getPlatformTrialDuration } = await import('@/lib/reach');
            const trialDays = await getPlatformTrialDuration();
            const trialExpiresAt = new Date(targetUser.teacherProfile.createdAt.getTime() + trialDays * 24 * 60 * 60 * 1000);
            if (trialExpiresAt > now) {
              restoredState = 'FREE_ACTIVE';
            } else {
              restoredState = 'PRO_EXPIRED';
            }
          }

          await prisma.teacherProfile.update({
            where: { id: targetUser.teacherProfile.id },
            data: { subscriptionState: restoredState },
          });
        }
        invalidateRankingCache();
        revalidatePath('/teachers');
        revalidatePath('/');
        await prisma.auditLog.create({
          data: { actorId: user.id, action: 'UNFREEZE_USER', target: targetUserId, category: 'ADMIN', details: adminNote || 'Account unfrozen by admin' },
        });
        return NextResponse.json({ success: true, message: 'تم رفع التجميد.' });
      }

      case 'SOFT_DELETE': {
        const now = new Date();
        const graceEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        await prisma.user.update({ where: { id: targetUserId }, data: { softDeletedAt: now, restorableUntil: graceEnd } });
        invalidateRankingCache();
        revalidatePath('/teachers');
        revalidatePath('/');
        await prisma.auditLog.create({
          data: { actorId: user.id, action: 'SOFT_DELETE_USER', target: targetUserId, category: 'ADMIN', details: adminNote || `Soft deleted. Restorable until ${graceEnd.toISOString()}` },
        });
        return NextResponse.json({ success: true, message: `تم حذف الحساب مؤقتاً. يمكن الاسترجاع حتى ${graceEnd.toLocaleDateString('ar-DZ')}.` });
      }

      case 'RESTORE': {
        if (!targetUser.softDeletedAt) return NextResponse.json({ error: 'الحساب غير محذوف.' }, { status: 400 });
        await prisma.user.update({ where: { id: targetUserId }, data: { softDeletedAt: null, restorableUntil: null, isFrozen: false } });
        invalidateRankingCache();
        revalidatePath('/teachers');
        revalidatePath('/');
        await prisma.auditLog.create({
          data: { actorId: user.id, action: 'RESTORE_USER', target: targetUserId, category: 'ADMIN', details: adminNote || 'Account restored by admin' },
        });
        return NextResponse.json({ success: true, message: 'تم استرجاع الحساب بنجاح.' });
      }

      case 'UPDATE_SUBSCRIPTION_DAYS': {
        const days = parseInt(String(subscriptionDays), 10);
        if (isNaN(days) || days < 1 || days > 365) {
          return NextResponse.json({ error: 'عدد الأيام يجب أن يكون بين 1 و 365.' }, { status: 400 });
        }
        if (!targetUser.teacherProfile) {
          return NextResponse.json({ error: 'المستخدم ليس أستاذاً.' }, { status: 400 });
        }
        const teacherId = targetUser.teacherProfile.id;
        const now = new Date();
        const newExpiry = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

        const existingSub = await prisma.subscription.findFirst({
          where: { teacherId, status: 'ACTIVE' },
          orderBy: { expiresAt: 'desc' },
        });

        if (existingSub) {
          // Still active? extend from current expiry (additive). Expired? start fresh from now.
          const baseDate = existingSub.expiresAt > now ? existingSub.expiresAt : now;
          const extendedExpiry = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
          await prisma.subscription.update({
            where: { id: existingSub.id },
            data: {
              expiresAt: extendedExpiry,
              status: 'ACTIVE',
              ...(existingSub.expiresAt <= now ? { startedAt: now } : {}),
            },
          });
          await prisma.teacherProfile.update({
            where: { id: teacherId },
            data: { subscriptionState: 'PRO_ACTIVE' },
          });
        } else {
          await prisma.subscription.create({
            data: {
              teacherId,
              plan: 'PRO_2800_30DAYS',
              amount: 0,
              status: 'ACTIVE',
              startedAt: now,
              expiresAt: newExpiry,
              paymentRef: `ADMIN_GRANT_${user.id.substring(0, 8)}`,
            },
          });
          await prisma.teacherProfile.update({
            where: { id: teacherId },
            data: { subscriptionState: 'PRO_ACTIVE' },
          });
        }

        invalidateRankingCache();
        revalidatePath('/teachers');
        revalidatePath('/');
        await prisma.auditLog.create({
          data: { actorId: user.id, action: 'UPDATE_SUBSCRIPTION', target: targetUserId, category: 'ADMIN', details: `Subscription extended by ${days} days` },
        });
        return NextResponse.json({ success: true, message: `تم تمديد الاشتراك بمقدار ${days} يوماً.` });
      }

      default:
        // Legacy: if no action provided, fall back to role update
        if (newRole) {
          await prisma.user.update({ where: { id: targetUserId }, data: { role: newRole } });
          await prisma.auditLog.create({
            data: { actorId: user.id, action: 'UPDATE_USER_ROLE', target: targetUserId, category: 'ADMIN', details: `Role → ${newRole}` },
          });
          return NextResponse.json({ success: true });
        }
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[ADMIN USERS PATCH]', error?.message);
    return NextResponse.json({ error: 'فشل في تنفيذ العملية الإدارية.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (user.role !== UserRole.ADMIN) return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('id');
    if (!targetUserId) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    if (targetUserId === user.id) return NextResponse.json({ error: 'لا يمكنك حذف حسابك الإداري الخاص.' }, { status: 400 });

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { teacherProfile: true },
    });
    if (!targetUser) return NextResponse.json({ error: 'المستخدم غير موجود.' }, { status: 404 });

    // If grace period has passed → hard delete
    const gracePassed = targetUser.restorableUntil && targetUser.restorableUntil < new Date();
    const alreadySoftDeleted = !!targetUser.softDeletedAt;

    if (alreadySoftDeleted && gracePassed) {
      // HARD DELETE after grace period
      await prisma.$transaction(async (tx) => {
        if (targetUser.teacherProfile) {
          const teacherId = targetUser.teacherProfile.id;
          const products = await tx.product.findMany({ where: { creatorId: teacherId }, select: { id: true } });
          const productIds = products.map((p) => p.id);
          if (productIds.length > 0) {
            await tx.productReview.deleteMany({ where: { productId: { in: productIds } } });
            await tx.productAsset.deleteMany({ where: { productId: { in: productIds } } });
            await tx.courseModule.deleteMany({ where: { productId: { in: productIds } } });
            await tx.productView.deleteMany({ where: { productId: { in: productIds } } });
            await tx.productContactRequest.deleteMany({ where: { productId: { in: productIds } } });
            await tx.product.deleteMany({ where: { id: { in: productIds } } });
          }
          await tx.review.deleteMany({ where: { targetId: teacherId } });
          await tx.reachEvent.deleteMany({ where: { teacherId } });
          await tx.subscription.deleteMany({ where: { teacherId } });
          await tx.paymentProof.deleteMany({ where: { teacherId } });
          await tx.assistantProfile.deleteMany({ where: { parentTeacherId: teacherId } });
          await tx.teacherProfile.delete({ where: { id: teacherId } });
        }
        await tx.productReview.deleteMany({ where: { userId: targetUserId } });
        await tx.review.deleteMany({ where: { authorId: targetUserId } });
        await tx.comment.deleteMany({ where: { userId: targetUserId } });
        await tx.postLike.deleteMany({ where: { userId: targetUserId } });
        await tx.post.deleteMany({ where: { authorId: targetUserId } });
        await tx.notification.deleteMany({ where: { userId: targetUserId } });
        await tx.userDailyVisit.deleteMany({ where: { userId: targetUserId } });
        await tx.communityReport.deleteMany({ where: { reporterId: targetUserId } });
        await tx.user.delete({ where: { id: targetUserId } });
      });

      invalidateRankingCache();
      await prisma.auditLog.create({
        data: { actorId: user.id, action: 'DELETE_USER_PERMANENT', target: targetUserId, category: 'ADMIN', details: `Permanent deletion: ${targetUser.fullName} (${targetUser.email})` },
      });
      return NextResponse.json({ success: true, message: `تم الحذف النهائي للمستخدم ${targetUser.fullName}.` });
    }

    // Otherwise — initiate soft-delete (7-day grace)
    const now = new Date();
    const graceEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    await prisma.user.update({
      where: { id: targetUserId },
      data: { softDeletedAt: now, restorableUntil: graceEnd },
    });

    invalidateRankingCache();
    await prisma.auditLog.create({
      data: { actorId: user.id, action: 'SOFT_DELETE_USER', target: targetUserId, category: 'ADMIN', details: `Soft deleted. Grace period ends ${graceEnd.toISOString()}` },
    });
    return NextResponse.json({
      success: true,
      message: `تم حذف الحساب مؤقتاً. يمكن الاسترجاع حتى ${graceEnd.toLocaleDateString('ar-DZ')}.`,
      gracePeriodEnds: graceEnd.toISOString(),
    });
  } catch (error: any) {
    console.error('[ADMIN DELETE USER]', error?.message);
    return NextResponse.json({ error: 'فشل حذف المستخدم' }, { status: 500 });
  }
}
