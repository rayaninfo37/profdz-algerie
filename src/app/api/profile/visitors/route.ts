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
      const teacher = await prisma.teacherProfile.findUnique({ where: { userId: user.id } });
      if (teacher) targetId = teacher.id;
    } else if (personaType === 'STUDENT' || personaType === 'PUPIL') {
      const student = await prisma.studentProfile.findUnique({ where: { userId: user.id } });
      if (student) targetId = student.id;
    } else if (personaType === 'PARENT') {
      const parent = await prisma.parentProfile.findUnique({ where: { userId: user.id } });
      if (parent) targetId = parent.id;
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
