import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
      select: {
        googleRefreshToken: true,
        googleEmail: true,
        sheetsDestination: true,
      },
    });

    if (!teacher) {
      return NextResponse.json({ connected: false });
    }

    const isConnected = !!teacher.googleRefreshToken;
    return NextResponse.json({
      connected: isConnected,
      email: teacher.googleEmail || null,
      sheetsDestination: teacher.sheetsDestination || null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error checking Google status' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await prisma.teacherProfile.update({
      where: { userId: user.id },
      data: {
        googleRefreshToken: null,
        googleAccessToken: null,
        googleTokenExpiry: null,
        googleEmail: null,
      },
    });

    return NextResponse.json({ success: true, message: 'تم إلغاء ربط حساب Google بنجاح.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error disconnecting Google' }, { status: 500 });
  }
}
