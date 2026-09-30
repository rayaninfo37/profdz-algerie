import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ notifications: [] }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const takeParam = searchParams.get('take');
    const skipParam = searchParams.get('skip');
    const take = takeParam ? Math.min(Math.max(parseInt(takeParam, 10) || 20, 1), 100) : 30;
    const skip = skipParam ? Math.max(parseInt(skipParam, 10) || 0, 0) : 0;

    const [total, unreadCount, notifications] = await Promise.all([
      prisma.notification.count({ where: { userId: user.id } }),
      prisma.notification.count({ where: { userId: user.id, isRead: false } }),
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
    ]);

    return NextResponse.json({ 
      success: true,
      notifications,
      unreadCount,
      pagination: {
        total,
        take,
        skip,
        hasMore: skip + notifications.length < total,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
