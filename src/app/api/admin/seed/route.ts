import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { UserRole } from '@/types';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
    }

    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_ADMIN_SEED !== 'true') {
      return NextResponse.json({
        error: 'عملية حقن البيانات التجريبية معطلة تماماً في بيئة الإنتاج لحماية البيانات الحقيقية.',
      }, { status: 403 });
    }

    // Trigger seed command safely
    const { stdout } = await execAsync('npx prisma db seed');

    return NextResponse.json({
      success: true,
      message: 'KRYTY Algerian Educational Seed Data reset successfully!',
      output: stdout,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to reset seed data: ' + error.message }, { status: 500 });
  }
}
