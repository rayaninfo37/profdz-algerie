import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@/types';
import { StudentDashboardClient } from '@/components/dashboard/StudentDashboardClient';

export const revalidate = 0;

export default async function StudentDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.STUDENT) {
    redirect('/login');
  }

  const follows = await prisma.follow.findMany({
    where: { followerId: user.id },
    include: {
      following: {
        include: {
          teacherProfile: true,
        },
      },
    },
  });

  const followedTeachers = follows
    .filter((f) => f.following.role === 'TEACHER' && f.following.teacherProfile)
    .map((f) => ({
      id: f.following.id,
      fullName: f.following.fullName,
      avatarUrl: f.following.avatarUrl,
      wilaya: f.following.wilaya,
      teacherProfile: f.following.teacherProfile,
    }));

  const [libraryItemsCount, reviewsCount] = await Promise.all([
    prisma.libraryItem.count({ where: { userId: user.id } }),
    prisma.review.count({ where: { authorId: user.id } }),
  ]);

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