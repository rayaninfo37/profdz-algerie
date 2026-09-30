import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@/types';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const { teacherProfileId, isVerified } = await request.json();

    if (!teacherProfileId) {
      return NextResponse.json({ error: 'Teacher Profile ID is required' }, { status: 400 });
    }

    const updatedProfile = await prisma.teacherProfile.update({
      where: { id: teacherProfileId },
      data: { isVerified: Boolean(isVerified) },
      include: { user: { select: { fullName: true } } },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: isVerified ? 'GRANT_VERIFICATION' : 'REVOKE_VERIFICATION',
        target: teacherProfileId,
        details: `Verification set to ${isVerified} for ${updatedProfile.user.fullName}`,
      },
    });

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update verification status' }, { status: 500 });
  }
}
