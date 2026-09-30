import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { storageService } from '@/lib/storage/StorageService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول للوصول إلى هذا المستند' }, { status: 401 });
    }

    const { id } = await params;

    // Check if id is a PaymentProof

    // 2. Check if id is a PaymentProof
    const paymentProof = await prisma.paymentProof.findUnique({
      where: { id },
      include: { teacher: true },
    });

    if (paymentProof) {
      const isOwner = paymentProof.teacher.userId === user.id;
      const isAdmin = user.role === 'ADMIN';

      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: 'غير مصرح لك بالاطلاع على وصل الدفع الخاص' }, { status: 403 });
      }

      const fileBuffer = await storageService.readPrivateFile(paymentProof.receiptUrl);
      const isPdf = paymentProof.receiptUrl.toLowerCase().endsWith('.pdf');

      return new NextResponse(new Uint8Array(fileBuffer), {
        status: 200,
        headers: {
          'Content-Type': isPdf ? 'application/pdf' : 'image/jpeg',
          'Content-Disposition': `inline; filename="receipt_${paymentProof.id}${isPdf ? '.pdf' : '.jpg'}"`,
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      });
    }

    return NextResponse.json({ error: 'المستند غير موجود' }, { status: 404 });
  } catch (error: any) {
    console.error('Private document stream error:', error);
    return NextResponse.json({ error: 'فشل في استرجاع المستند' }, { status: 500 });
  }
}
