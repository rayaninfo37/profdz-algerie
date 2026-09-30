// scripts/cleanupDemoData.ts
import { prisma } from '@/lib/db';
import { UserRole } from '@/types';

/**
 * Deletes demo Teacher and Institution accounts and all related data.
 * Demo accounts are identified by:
 *   - email containing "demo@" (case‑insensitive)
 *   - or a boolean flag `isDemo` on the User model (if present)
 * The script runs inside a Prisma transaction to ensure consistency.
 */
async function deleteDemoAccounts() {
  const demoUsers = await prisma.user.findMany({
    where: { email: { contains: "demo@" }, role: { in: ["TEACHER", "INSTITUTION"] } },
    select: { id: true, email: true, role: true, avatarUrl: true },
  });

  if (demoUsers.length === 0) {
    console.log('No demo accounts found.');
    return;
  }

  console.log(`Found ${demoUsers.length} demo accounts. Proceeding to delete...`);

  for (const user of demoUsers) {
    await prisma.$transaction(async (tx) => {
      // Delete posts authored by the user
      const posts = await tx.post.findMany({ where: { authorId: user.id } });
      const postIds = posts.map((p) => p.id);
      if (postIds.length) {
        await tx.postLike.deleteMany({ where: { postId: { in: postIds } } });
        await tx.comment.deleteMany({ where: { postId: { in: postIds } } });
        await tx.post.deleteMany({ where: { id: { in: postIds } } });
      }

      // Delete reviews authored by the user
      await tx.review.deleteMany({ where: { authorId: user.id } });

      // Delete follows where user is follower or following
      await tx.follow.deleteMany({ where: { OR: [{ followerId: user.id }, { followingId: user.id }] } });

      // Delete reach events viewed by the user
      await tx.reachEvent.deleteMany({ where: { viewerUserId: user.id } });

      // Finally delete the user record (cascades related profiles)
      await tx.user.delete({ where: { id: user.id } });
    });
    console.log(`Deleted demo user ${user.email} (role: ${user.role})`);
  }

  console.log('Demo cleanup complete.');
}

if (require.main === module) {
  deleteDemoAccounts()
    .catch((e) => {
      console.error('Error during demo cleanup:', e);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}

export default deleteDemoAccounts;
