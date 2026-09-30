import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@/types';
import { ParentDashboardClient } from '@/components/dashboard/ParentDashboardClient';

export const revalidate = 0;

export default async function ParentDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.PARENT) {
    redirect('/login');
  }

  // Fetch parent profile with user data
  const parentProfile = await prisma.parentProfile.findUnique({
    where: { userId: user.id },
  });

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-100" dir="rtl">
      <ParentDashboardClient
        user={user}
        parentProfile={parentProfile}
        followedTeachers={followedTeachers}
      />
    </div>
  );
}