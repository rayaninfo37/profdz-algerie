import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

type AuthResult =
  | { user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>; blocked: false; response: null }
  | { user: null; blocked: false; response: NextResponse }
  | { user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>; blocked: true; response: NextResponse };

/**
 * Require authentication. Returns 401 if not logged in, 403 if frozen/soft-deleted.
 * Usage:
 *   const { user, response } = await requireAuth();
 *   if (response) return response;
 */
export async function requireAuth(requireRole?: string): Promise<AuthResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      blocked: false,
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    };
  }

  const isBlocked = (user as any)._blocked === true;

  if (isBlocked) {
    const isFrozen = (user as any).isFrozen;
    const isSoftDeleted = !!(user as any).softDeletedAt;
    const msg = isFrozen
      ? 'تم تجميد حسابك. تواصل مع الإدارة.'
      : isSoftDeleted
      ? 'هذا الحساب تم حذفه. تواصل مع الإدارة لاسترجاعه.'
      : 'الحساب غير نشط.';
    return {
      user: user as any,
      blocked: true,
      response: NextResponse.json({ error: msg }, { status: 403 }),
    };
  }

  if (requireRole && user.role !== requireRole) {
    return {
      user: user as any,
      blocked: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { user: user as any, blocked: false, response: null };
}
