import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getAlgiersDateString } from '@/lib/algiersTime';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, reason: 'unauthenticated' }, { status: 200 });
    }

    const todayStr = getAlgiersDateString();

    // Idempotent daily visit record per registered user per local Algiers day
    await prisma.userDailyVisit.upsert({
      where: {
        userId_dateStr: {
          userId: user.id,
          dateStr: todayStr,
        },
      },
      update: {},
      create: {
        userId: user.id,
        dateStr: todayStr,
      },
    });

    return NextResponse.json({ success: true, recorded: true, dateStr: todayStr });
  } catch (error: any) {
    console.error('Failed to record user daily visit:', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
