import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getProfileVisitors } from '@/lib/visitorTracking';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const personaType = searchParams.get('type') || user.role;

    let targetId = user.id;
    if (personaType === 'TEACHER' || personaType === 'ACADEMIC') {
      targetId = user.teacherProfile?.id || user.id;
    } else if (personaType === 'STUDENT' || personaType === 'PUPIL') {
      targetId = user.studentProfile?.id || user.id;
    } else if (personaType === 'PARENT') {
      targetId = user.parentProfile?.id || user.id;
    }

    const result = await getProfileVisitors(targetId, personaType, 20);

    return NextResponse.json({
      visitors: result.visitors,
      totalViews: result.totalViews,
      uniqueViewersCount: result.uniqueViewersCount,
    });
  } catch (error) {
    console.error('Error fetching visitors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
