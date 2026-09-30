import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json().catch(() => ({}));
    const { targetId, targetType = 'TEACHER', productId, method } = body;

    if (!targetId || !method) {
      return NextResponse.json({ error: 'targetId and method are required' }, { status: 400 });
    }

    // Record contact event in DB for teacher metrics & analytics (Rule 9: Contact click is an analytics event, NOT an in-app notification)
    const event = await prisma.contactEvent.create({
      data: {
        targetId,
        targetType: targetType || 'TEACHER',
        productId: productId || null,
        method: String(method).toUpperCase(),
        viewerId: user?.id || null,
      },
    });

    return NextResponse.json({ success: true, eventId: event.id });
  } catch (error: any) {
    console.error('Contact event record error:', error);
    return NextResponse.json({ error: 'Failed to record contact event' }, { status: 500 });
  }
}
