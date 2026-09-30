import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول لتقديم بلاغ أو شكوى.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { targetType, targetId, reason, details } = body;

    if (!targetType || !targetId || !reason) {
      return NextResponse.json({ error: 'يرجى تحديد نوع الهدف وسبب الشكوى أو البلاغ.' }, { status: 400 });
    }

    const validTargetTypes = ['POST', 'COMMENT', 'USER'];
    if (!validTargetTypes.includes(targetType)) {
      return NextResponse.json({ error: 'نوع البلاغ غير صالح.' }, { status: 400 });
    }

    // Anti-Spam: Check if same user already reported this exact target while pending
    const existing = await prisma.communityReport.findFirst({
      where: {
        reporterId: user.id,
        targetType,
        targetId,
        status: 'PENDING',
      },
    });

    if (existing) {
      return NextResponse.json({
        error: 'لقد قمت بتقديم بلاغ بخصوص هذا المحتوى مسبقاً، وهو قيد المراجعة الإدارية.',
      }, { status: 400 });
    }

    const report = await prisma.communityReport.create({
      data: {
        reporterId: user.id,
        targetType,
        targetId,
        reason: String(reason).trim(),
        details: details ? String(details).trim() : null,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم استلام شكواك وبلاغك بنجاح وسيتولى فريق الإشراف مراجعته.',
      reportId: report.id,
    });
  } catch (error: any) {
    console.error('Community report submission error:', error);
    return NextResponse.json({ error: 'فشل في إرسال البلاغ. يرجى المحاولة لاحقاً.' }, { status: 500 });
  }
}

