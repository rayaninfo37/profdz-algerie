import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@/types';
import { StudentDashboardClient } from '@/components/dashboard/StudentDashboardClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.STUDENT) {
    redirect('/login');
  }

  const [follows, libraryItemsCount, reviewsCount] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: user.id },
      select: {
        following: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            wilaya: true,
            role: true,
            teacherProfile: {
              select: {
                id: true,
                headline: true,
                subjects: true,
                subscriptionState: true,
                isVerified: true,
              },
            },
          },
        },
      },
    }),
    prisma.libraryItem.count({ where: { userId: user.id } }),
    prisma.review.count({ where: { authorId: user.id } }),
  ]);

  const followedTeachers = follows
    .filter((f) => f.following.role === 'TEACHER' && f.following.teacherProfile)
    .map((f) => ({
      id: f.following.id,
      fullName: f.following.fullName,
      avatarUrl: f.following.avatarUrl,
      wilaya: f.following.wilaya,
      teacherProfile: f.following.teacherProfile,
    }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-100" dir="rtl">
      <StudentDashboardClient
        user={user}
        followedTeachers={followedTeachers}
        libraryItemsCount={libraryItemsCount}
        reviewsCount={reviewsCount}
      />
    </div>
  );
}