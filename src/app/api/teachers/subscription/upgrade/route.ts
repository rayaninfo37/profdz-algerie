import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole, PaymentProofStatus } from '@/types';
import { KRYTY_CONFIG } from '@/lib/config';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.TEACHER || !user.teacherProfile) {
      return NextResponse.json({ error: 'عذراً، يجب تسجيل الدخول بحساب أستاذ لإتمام هذه العملية.' }, { status: 403 });
    }

    const teacherId = user.teacherProfile.id;
    const body = await request.json().catch(() => ({}));
    const { receiptUrl, transactionRef } = body;

    if (!receiptUrl) {
      return NextResponse.json({
        error: 'يرجى رفع وصل التحويل البنكي أو البريدي كإثبات للدفع (صورة أو PDF).',
      }, { status: 400 });
    }

    // Check if there is already a pending proof
    const existingPending = await prisma.paymentProof.findFirst({
      where: {
        teacherId,
        status: PaymentProofStatus.PENDING,
      },
    });

    if (existingPending) {
      return NextResponse.json({
        error: 'لديك بالفعل وصل دفع قيد المراجعة حالياً من قبل الإدارة. سيتم إشعارك فور تدقيقه.',
      }, { status: 400 });
    }

    const { getTeacherProPrice, getPlanByCode } = await import('@/lib/pricing');
    const teacherPlan = await getPlanByCode('TEACHER_PRO');
    const amount = teacherPlan?.priceDZD ?? (await getTeacherProPrice());
    const durationDays = teacherPlan?.durationDays ?? KRYTY_CONFIG.subscription.proPlanDurationDays;

    // Create PaymentProof with status PENDING for Admin human verification
    const paymentProof = await prisma.paymentProof.create({
      data: {
        teacherId,
        plan: `PRO_${amount}_${durationDays}DAYS`,
        amount,
        receiptUrl,
        transactionRef: transactionRef ? transactionRef.trim() : null,
        status: PaymentProofStatus.PENDING,
      },
    });

    // Create In-App Notification for Teacher
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'تم استلام وصل التحويل بنجاح',
        message: `تم رفع وصل الاشتراك في باقة PRO (${amount.toLocaleString()} دج) وهو قيد المراجعة الإدارية.`,
        type: 'SUBSCRIPTION',
      },
    });

    return NextResponse.json({
      success: true,
      paymentProof,
      message: 'تم إرسال وصل الدفع بنجاح! سيقوم فريق الإدارة بمراجعته وتفعيل اشتراكك خلال ساعات قليلة.',
    });
  } catch (error: any) {
    console.error('Payment proof submission error:', error);
    return NextResponse.json({ error: 'فشل في إرسال وصل الدفع. يرجى المحاولة لاحقاً.' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.TEACHER || !user.teacherProfile) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const proofs = await prisma.paymentProof.findMany({
      where: { teacherId: user.teacherProfile.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({ success: true, proofs });
  } catch (error: any) {
    return NextResponse.json({ error: 'فشل في جلب وصولات الدفع' }, { status: 500 });
  }
}
