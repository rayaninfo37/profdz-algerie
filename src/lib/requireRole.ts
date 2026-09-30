import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

/**
 * Server-side role authorization helper.
 * Returns { user, errorResponse: null } when the caller has a permitted role.
 * Returns { user: null, errorResponse } when unauthenticated or unauthorized.
 */
export async function requireRole(allowedRoles: string[]) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: 'يجب تسجيل الدخول للوصول إلى هذه الخدمة.' },
        { status: 401 }
      ),
    };
  }

  // Admin users are never blocked by freeze or soft-delete checks
  if (user.role !== 'ADMIN') {
    if (user.isFrozen) {
      return {
        user: null,
        errorResponse: NextResponse.json(
          { error: 'تم تجميد هذا الحساب من قبل الإدارة.' },
          { status: 403 }
        ),
      };
    }
    if (user.softDeletedAt) {
      return {
        user: null,
        errorResponse: NextResponse.json(
          { error: 'هذا الحساب تم حذفه.' },
          { status: 403 }
        ),
      };
    }
  }

  // For dual-role users respect activeRole, fallback to base role
  const effectiveRole = user.activeRole || user.role;

  if (!allowedRoles.includes(effectiveRole) && !allowedRoles.includes(user.role)) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: 'ليس لديك الصلاحيات الكافية لتنفيذ هذه العملية.' },
        { status: 403 }
      ),
    };
  }

  return { user, errorResponse: null };
}

/**
 * Admin-only guard that returns the user or a 403 error response.
 */
export async function requireAdmin() {
  return requireRole(['ADMIN']);
}
