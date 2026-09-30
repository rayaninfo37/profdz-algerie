import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole, PaymentProofStatus } from '@/types';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'صلاحيات المدير مطلوبة' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = body.reason?.trim() || 'الوصل غير واضح أو البيانات لا تتطابق مع التحويل.';

    const paymentProof = await prisma.paymentProof.findUnique({
      where: { id },
      include: { teacher: { include: { user: true } } },
    });

    if (!paymentProof) {
      return NextResponse.json({ error: 'وصل الدفع غير موجود' }, { status: 404 });
    }

    // Atomic transaction for payment proof rejection and audit trail
    await prisma.$transaction(async (tx) => {
      // 1. Mark PaymentProof as REJECTED
      await tx.paymentProof.update({
        where: { id },
        data: {
          status: PaymentProofStatus.REJECTED,
          reviewedAt: new Date(),
          adminNotes: reason,
        },
      });

      // 2. Notify teacher
      await tx.notification.create({
        data: {
          userId: paymentProof.teacher.userId,
          title: 'تنبيه بخصوص وصل الاشتراك',
          message: `تعذر اعتماد وصل الدفع المرسل. السبب: ${reason}. يرجى مراجعة الإدارة أو إعادة رفع وصل صالح.`,
          type: 'SUBSCRIPTION',
        },
      });

      // 3. Persistent Admin Audit Trail
      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: 'REJECT_PAYMENT_PROOF',
          target: paymentProof.id,
          details: `Rejected payment proof for teacher ${paymentProof.teacher.user.fullName} (${paymentProof.teacherId}). Reason: ${reason}`,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'تم رفض الوصل وإشعار الأستاذ بالسبب.',
    });
  } catch (error: any) {
    console.error('Reject payment error:', error);
    return NextResponse.json({ error: 'فشل في رفض الوصل' }, { status: 500 });
  }
}
