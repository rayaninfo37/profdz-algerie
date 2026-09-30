'use client';

import React, { useState } from 'react';
import { Users, BookOpen, Compass, GraduationCap, Edit3, Library } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import AvatarFallback from '@/components/common/AvatarFallback';
import { ProfileEditorModal } from '@/components/dashboard/ProfileEditorModal';
import Link from 'next/link';

export interface StudentDashboardClientProps {
  user: any;
  followedTeachers: Array<{
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    wilaya?: string | null;
    teacherProfile?: {
      id: string;
      headline?: string | null;
      subjects?: string;
    } | null;
  }>;
  libraryItemsCount: number;
  reviewsCount?: number;
}

export const StudentDashboardClient: React.FC<StudentDashboardClientProps> = ({
  user,
  followedTeachers,
  libraryItemsCount,
  reviewsCount = 0,
}) => {
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  return (
    <>
      <div className="space-y-8 text-stone-100">
        {/* Header */}
        <div className="clean-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#111D38] border border-[#1E3A5F]">
          <div className="flex items-center gap-4">
            <AvatarFallback
              src={user.avatarUrl}
              name={user.fullName}
              size={64}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-teal-500 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">{user.fullName}</h1>
                <Badge variant="teal" size="sm">طالب</Badge>
              </div>
              <p className="text-xs text-teal-300 font-semibold pt-1">
                المستوى الدراسي: {user.studentProfile?.educationLevel || 'البكالوريا'} | الولاية: {user.wilaya || 'الجزائر'}
              </p>
              <div className="flex items-center gap-3 pt-2 text-xs flex-wrap">
                <span className="p-1.5 px-3 bg-slate-900/90 rounded-lg border border-slate-700 text-stone-200">
                  المكتبة الرقمية: <strong className="text-teal-400 font-black">{libraryItemsCount}</strong> موارد
                </span>
                <span className="p-1.5 px-3 bg-slate-900/90 rounded-lg border border-slate-700 text-stone-200">
                  الأساتذة المفضلون: <strong className="text-sky-300 font-black">{followedTeachers.length}</strong>
                </span>
                <span className="p-1.5 px-3 bg-slate-900/90 rounded-lg border border-slate-700 text-stone-200">
                  التقييمات المقدمة: <strong className="text-amber-400 font-black">{reviewsCount}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setEditProfileOpen(true)}
              className="gap-2 border-slate-700 text-stone-200 hover:bg-slate-800 font-bold"
            >
              <Edit3 className="w-4 h-4 text-teal-400" /> تعديل الملف
            </Button>
            <Link href="/products">
              <Button variant="primary" size="md" className="gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold">
                <Library className="w-4 h-4" /> الموارد التعليمية ({libraryItemsCount})
              </Button>
            </Link>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Followed Teachers */}
          <div className="clean-card p-6 space-y-4 bg-[#111D38] border border-[#1E3A5F]">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-400" /> الأساتذة الذين تتابعهم ({followedTeachers.length})
            </h3>
            {followedTeachers.length > 0 ? (
              <div className="space-y-2.5 max-h-80 overflow-y-auto">
                {followedTeachers.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-3">
                      <AvatarFallback
                        src={t.avatarUrl}
                        name={t.fullName}
                        size={40}
                        className="w-10 h-10 rounded-xl border border-teal-500"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-white">{t.fullName}</h4>
                        <p className="text-[11px] text-teal-300 truncate max-w-[180px]">
                          {t.teacherProfile?.headline || 'أستاذ تعليمي'}
                        </p>
                      </div>
                    </div>
                    {t.teacherProfile && (
                      <Link href={`/teachers/${t.teacherProfile.id}`}>
                        <Button variant="outline" size="sm" className="border-slate-700 text-stone-200 hover:bg-slate-800 text-xs">
                          عرض الملف
                        </Button>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-stone-400 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                <p>أنت لا تتابع أي أستاذ حالياً.</p>
                <Link href="/teachers">
                  <Button variant="primary" size="sm" className="bg-teal-600 font-bold">
                    استكشاف الأساتذة المعتمدين
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Quick Access & Educational Tools */}
          <div className="space-y-6">
            <div className="clean-card p-6 space-y-4 bg-[#111D38] border border-[#1E3A5F]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-teal-400" /> اختصارات سريعة
              </h3>
              <p className="text-xs text-stone-300">
                تصفح مصادر التعلم وتواصل مباشرة مع الأساتذة المعتمدين في مختلف المواد والمستويات.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Link href="/teachers" className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2 border-slate-700 text-stone-200 text-xs">
                    <Compass className="w-3.5 h-3.5 text-teal-400" /> دليل الأساتذة المعتمدين
                  </Button>
                </Link>
                <Link href="/products" className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2 border-slate-700 text-stone-200 text-xs">
                    <BookOpen className="w-3.5 h-3.5 text-teal-400" /> المتجر والمكتبة التعليمية
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProfileEditorModal
        isOpen={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        user={user}
        onProfileUpdated={() => window.location.reload()}
      />
    </>
  );
};
