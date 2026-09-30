import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@/types';
import { validateAlgerianPhone } from '@/lib/algerianPhone';
import { invalidateRankingCache } from '@/lib/ranking';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id: targetUserId } = await params;
    const body = await request.json().catch(() => ({}));

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { teacherProfile: true },
    });
    if (!targetUser) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }

    const updates: Record<string, any> = {};
    const teacherUpdates: Record<string, any> = {};

    // User-level fields
    if (body.fullName !== undefined && String(body.fullName).trim()) {
      updates.fullName = String(body.fullName).trim().substring(0, 100);
    }
    if (body.wilaya !== undefined) updates.wilaya = body.wilaya || null;

    // Teacher-level fields
    if (targetUser.teacherProfile) {
      if (body.phone !== undefined) {
        if (!body.phone || !String(body.phone).trim()) {
          teacherUpdates.phone = null;
        } else {
          const pv = validateAlgerianPhone(String(body.phone), false);
          if (!pv.isValid) return NextResponse.json({ error: pv.error || 'رقم الهاتف غير صالح' }, { status: 400 });
          // Check uniqueness for other users
          const existing = await prisma.user.findFirst({
            where: { phone: pv.normalizedPhone!, NOT: { id: targetUser.id } },
          });
          if (existing) return NextResponse.json({ error: 'رقم الهاتف مستخدم من قِبَل حساب آخر' }, { status: 409 });
          teacherUpdates.phone = pv.normalizedPhone;
          updates.phone = pv.normalizedPhone;
        }
      }
      if (body.whatsapp !== undefined) {
        if (!body.whatsapp || !String(body.whatsapp).trim()) {
          teacherUpdates.whatsapp = null;
        } else {
          const wv = validateAlgerianPhone(String(body.whatsapp), false);
          if (!wv.isValid) return NextResponse.json({ error: wv.error || 'رقم واتساب غير صالح' }, { status: 400 });
          teacherUpdates.whatsapp = wv.normalizedPhone;
        }
      }
      if (body.telegram !== undefined) teacherUpdates.telegram = body.telegram ? String(body.telegram).trim().substring(0, 100) : null;
      if (body.website !== undefined) {
        if (!body.website || !String(body.website).trim()) {
          teacherUpdates.website = null;
        } else {
          const ws = String(body.website).trim();
          if (!/^https?:\/\//i.test(ws)) return NextResponse.json({ error: 'رابط الموقع يجب أن يبدأ بـ https://' }, { status: 400 });
          if (/javascript:|data:|vbscript:/i.test(ws)) return NextResponse.json({ error: 'رابط غير مقبول' }, { status: 400 });
          teacherUpdates.website = ws.substring(0, 500);
        }
      }
      if (body.bio !== undefined) teacherUpdates.bio = body.bio ? String(body.bio).trim().substring(0, 1000) : null;
      if (body.headline !== undefined) teacherUpdates.headline = body.headline ? String(body.headline).trim().substring(0, 200) : null;
      if (body.sheetsDestination !== undefined) {
        const sd = String(body.sheetsDestination || '').trim();
        if (!sd) {
          teacherUpdates.sheetsDestination = null;
        } else {
          const { validateGoogleSheetUrl } = await import('@/lib/googleSheets');
          const val = validateGoogleSheetUrl(sd);
          teacherUpdates.sheetsDestination = val.isValid ? (val.canonicalUrl || sd) : sd;
        }
      }
    }

    // Apply updates
    if (Object.keys(updates).length > 0) {
      await prisma.user.update({ where: { id: targetUserId }, data: updates });
    }
    if (Object.keys(teacherUpdates).length > 0 && targetUser.teacherProfile) {
      await prisma.teacherProfile.update({
        where: { id: targetUser.teacherProfile.id },
        data: teacherUpdates,
      });
    }

    invalidateRankingCache();

    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        action: 'ADMIN_EDIT_USER',
        target: targetUserId,
        category: 'ADMIN',
        details: `Admin edited: ${Object.keys({ ...updates, ...teacherUpdates }).join(', ')}`,
      },
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { teacherProfile: true, studentProfile: true },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('[ADMIN EDIT USER]', error?.message);
    return NextResponse.json({ error: 'فشل تعديل بيانات المستخدم' }, { status: 500 });
  }
}
