import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@/types';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'غير مصرح لك بالوصول.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { status, adminNotes } = body;

    const validStatuses = ['PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'حالة البلاغ غير صالحة.' }, { status: 400 });
    }

    const updatedReport = await prisma.communityReport.update({
      where: { id },
      data: {
        status,
        adminNotes: adminNotes ? String(adminNotes).trim() : undefined,
        resolvedAt: status === 'RESOLVED' || status === 'DISMISSED' ? new Date() : undefined,
      },
    });

    // Record admin moderation in AuditLog
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: `REPORT_${status}`,
        target: id,
        details: adminNotes ? `Report status changed to ${status}. Note: ${adminNotes}` : `Report status changed to ${status}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'تم تحديث حالة البلاغ بنجاح.',
      report: updatedReport,
    });
  } catch (error: any) {
    console.error('Update community report error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تحديث البلاغ.' }, { status: 500 });
  }
}