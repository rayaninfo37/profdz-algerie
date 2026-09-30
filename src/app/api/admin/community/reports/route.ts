import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@/types';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'غير مصرح لك بالوصول.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'ALL';

    const where: any = {};
    if (status !== 'ALL') {
      where.status = status;
    }

    const reports = await prisma.communityReport.findMany({
      where,
      include: {
        reporter: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ reports });
  } catch (error: any) {
    console.error('Fetch community reports error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب البلاغات.' }, { status: 500 });
  }
}
