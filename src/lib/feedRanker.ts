/**
 * Hacker News / Reddit gravity engagement decay algorithm for KRYTY feed
 * Score = (Likes + 2 * Comments) / ((AgeInHours + 2) ^ 1.2)
 */

export interface FeedPostRankInput {
  id: string;
  createdAt: Date | string;
  likesCount: number;
  commentsCount: number;
  isPinned?: boolean;
}

export function calculatePostScore(likes: number, comments: number, createdAt: Date | string): number {
  const postDate = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const now = new Date();
  const diffHours = Math.max(0, (now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
  
  const rawEngagement = Math.max(0, likes) + 2 * Math.max(0, comments);
  const gravity = Math.pow(diffHours + 2, 1.2);
  
  return rawEngagement / gravity;
}

export function rankPosts<T extends FeedPostRankInput>(posts: T[]): (T & { rankScore: number })[] {
  return posts
    .map((post) => ({
      ...post,
      rankScore: post.isPinned ? 999999 : calculatePostScore(post.likesCount, post.commentsCount, post.createdAt),
    }))
    .sort((a, b) => b.rankScore - a.rankScore);
}
