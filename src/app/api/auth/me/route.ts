import { NextResponse } from 'next/server';
import { getCurrentUser, sanitizeUserForClient } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/middleware/rateLimitMiddleware';

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

  // Fetch real counts
  const [followersCount, followingCount, likesCount, postsCount] = await Promise.all([
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id } }),
    prisma.postLike.count({ where: { post: { authorId: user.id } } }),
    prisma.post.count({ where: { authorId: user.id } }),
  ]);

  const safeUser = sanitizeUserForClient(user);
  return NextResponse.json({
    authenticated: true,
    blocked: false,
    user: {
      ...safeUser,
      stats: { followersCount, followingCount, likesCount, postsCount },
    },
  });
}
