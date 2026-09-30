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

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    const result = await getProfileVisitors(teacher.id, 'TEACHER', 20);

    return NextResponse.json({
      visitors: result.visitors,
      totalViews: result.totalViews,
    });
  } catch (error) {
    console.error('Error fetching teacher visitors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
