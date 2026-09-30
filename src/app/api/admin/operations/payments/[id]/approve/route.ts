import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole, SubscriptionState, SubscriptionStatus, PaymentProofStatus } from '@/types';
import { getSubscriptionDuration } from '@/lib/config';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'صلاحيات المدير مطلوبة' }, { status: 403 });
    }

    const { id } = await params;
    const paymentProof = await prisma.paymentProof.findUnique({
      where: { id },
      include: { teacher: { include: { user: true } } },
    });

    if (!paymentProof) {
      return NextResponse.json({ error: 'وصل الدفع غير موجود' }, { status: 404 });
    }

    const durationDays = await getSubscriptionDuration();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    // Atomic transaction for payment approval, subscription creation, and audit logging
    await prisma.$transaction(async (tx) => {
      // 1. Mark PaymentProof as APPROVED
      await tx.paymentProof.update({
        where: { id },
        data: {
          status: PaymentProofStatus.APPROVED,
          reviewedAt: new Date(),
          adminNotes: 'تمت الموافقة من قِبل إدارة المنظومة',
        },
      });

      // 2. Activate PRO_ACTIVE state on TeacherProfile
      await tx.teacherProfile.update({
        where: { id: paymentProof.teacherId },
        data: {
          subscriptionState: SubscriptionState.PRO_ACTIVE,
        },
      });

      // 3. Create Subscription record
      await tx.subscription.create({
        data: {
          teacherId: paymentProof.teacherId,
          plan: `PRO_${paymentProof.amount}_${durationDays}DAYS`,
          amount: paymentProof.amount,
          status: SubscriptionStatus.ACTIVE,
          startedAt: new Date(),
          expiresAt,
          paymentRef: paymentProof.transactionRef || `PROOF_${paymentProof.id}`,
        },
      });

      // 4. Send in-app notification to teacher
      await tx.notification.create({
        data: {
          userId: paymentProof.teacher.userId,
          title: 'تهانينا! تم تفعيل اشتراك PRO بنجاح',
          message: `تمت مراجعة وصل التحويل وتفعيل باقة PRO لحسابك لمدة ${durationDays} يوماً (حتى ${expiresAt.toLocaleDateString('ar-DZ')}). استمتع بالوصول غير المحدود والميزات المتقدمة.`,
          type: 'SUBSCRIPTION',
        },
      });

      // 5. Persistent Admin Audit Trail
      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: 'APPROVE_PAYMENT_PROOF',
          target: paymentProof.id,
          details: `Approved payment proof for teacher ${paymentProof.teacher.user.fullName} (${paymentProof.teacherId}), amount: ${paymentProof.amount} DZD, plan: ${durationDays} days`,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'تم اعتماد وصل الدفع وتفعيل باقة PRO بنجاح.',
    });
  } catch (error: any) {
    console.error('Approve payment error:', error);
    return NextResponse.json({ error: 'فشل في اعتماد الدفع' }, { status: 500 });
  }
}
