import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@/types';

export async function GET(request: Request) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'صلاحيات المدير مطلوبة' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';
    const action = searchParams.get('action')?.trim() || '';
    const category = searchParams.get('category')?.trim() || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(10, parseInt(searchParams.get('pageSize') || '30', 10)));

    // Idempotent cleanup: delete transient LOGIN_ACTIVITY records older than 168 hours
    const cutoff168h = new Date(Date.now() - 168 * 60 * 60 * 1000);
    await prisma.auditLog.deleteMany({
      where: {
        category: 'LOGIN_ACTIVITY',
        createdAt: { lt: cutoff168h },
      },
    });

    const where: any = {
      // By default, hide transient login activity from the main admin view
      // (unless explicitly requested via category filter)
      ...(category ? { category } : { category: { not: 'LOGIN_ACTIVITY' } }),
    };
    if (action) {
      where.action = action;
    }
    if (query) {
      where.OR = [
        { details: { contains: query } },
        { target: { contains: query } },
        { actor: { fullName: { contains: query } } },
        { actor: { email: { contains: query } } },
      ];
    }

    const [total, auditLogs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      success: true,
      auditLogs,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    });
  } catch (error: any) {
    console.error('Fetch audit logs error:', error);
    return NextResponse.json({ error: 'فشل في استرجاع سجل العمليات الإدارية' }, { status: 500 });
  }
}
