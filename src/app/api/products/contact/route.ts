import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/middleware/rateLimitMiddleware';

export async function POST(request: Request) {
  const limitRes = await rateLimit(request, 15);
  if (limitRes) return limitRes;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول لإرسال طلب تواصل.' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, message } = body;

    if (!productId) {
      return NextResponse.json({ error: 'معرف المادة أو الدورة مطلوب.' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'المادة التعليمية غير موجودة.' }, { status: 404 });
    }

    // Find teacher profile for creator
    let teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: product.creatorId },
    });

    if (!teacherProfile) {
      teacherProfile = await prisma.teacherProfile.findFirst({
        where: { id: product.creatorId },
      });
    }

    if (!teacherProfile) {
      return NextResponse.json({ error: 'لم يتم العثور على ملف الأستاذ صاحب هذه المادة.' }, { status: 404 });
    }

    // Create contact request record
    const contactReq = await prisma.productContactRequest.create({
      data: {
        productId: product.id,
        teacherId: teacherProfile.id,
        userId: user.id,
        status: 'PENDING',
        message: message ? message.trim() : null,
      },
    });

    // Create in-app notification for the teacher
    await prisma.notification.create({
      data: {
        userId: teacherProfile.userId,
        title: 'استفسار واهتمام جديد بمنتجك التعليمي',
        message: `أبدى ${user.fullName} اهتماماً بـ "${product.title}". يمكنك التواصل معه الآن من لوحة التحكم.`,
        type: 'SYSTEM',
      },
    });

    try {
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/dashboard/teacher');
    } catch {}

    return NextResponse.json({
      success: true,
      contactRequest: contactReq,
      teacherPhone: teacherProfile.phone,
      whatsapp: teacherProfile.whatsapp,
      telegram: teacherProfile.telegram,
      message: 'تم تسجيل طلب التواصل وإشعار الأستاذ بنجاح.',
    });
  } catch (error: any) {
    console.error('Product contact request error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء معالجة طلب التواصل.' }, { status: 500 });
  }
}
