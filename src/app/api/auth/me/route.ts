import { NextResponse } from 'next/server';
import { getCurrentUser, sanitizeUserForClient } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/middleware/rateLimitMiddleware';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const limitRes = await rateLimit(request, 60, 60_000); // lenient for polling
  if (limitRes) return limitRes;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  // Blocked users (frozen / soft-deleted): return their state so UI can show message
  const isBlocked = (user as any)._blocked === true;
  if (isBlocked) {
    return NextResponse.json({
      authenticated: true,
      blocked: true,
      isFrozen: (user as any).isFrozen,
      softDeleted: !!(user as any).softDeletedAt,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isFrozen: (user as any).isFrozen,
        softDeletedAt: (user as any).softDeletedAt,
      },
    });
  }

  // Only compute expensive aggregate counts if explicitly requested by caller
  const { searchParams } = new URL(request.url);
  const includeStats = searchParams.get('stats') === 'true';

  let stats = { followersCount: 0, followingCount: 0, likesCount: 0, postsCount: 0 };
  if (includeStats) {
    const [followersCount, followingCount, likesCount, postsCount] = await Promise.all([
      prisma.follow.count({ where: { followingId: user.id } }),
      prisma.follow.count({ where: { followerId: user.id } }),
      prisma.postLike.count({ where: { post: { authorId: user.id } } }),
      prisma.post.count({ where: { authorId: user.id } }),
    ]);
    stats = { followersCount, followingCount, likesCount, postsCount };
  }

  const safeUser = sanitizeUserForClient(user);
  return NextResponse.json({
    authenticated: true,
    blocked: false,
    user: {
      ...safeUser,
      stats,
    },
  });
}
