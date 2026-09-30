import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { UserRole } from '@/types';

/**
 * Ensures the current user is an admin.
 * Returns the user object if admin; otherwise returns null (callers must handle with 403).
 * Use the new requireRole(['ADMIN']) from src/lib/requireRole.ts for new routes.
 */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.ADMIN) {
    return null;
  }
  return user;
}

export function adminForbidden() {
  return NextResponse.json(
    { error: 'هذه العملية مخصصة للمشرفين فقط. غير مصرح لك بالوصول.' },
    { status: 403 }
  );
}
