'use client';

import React, { useState } from 'react';
import { Users, BookOpen, Search, ShieldCheck, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import AvatarFallback from '@/components/common/AvatarFallback';
import { ProfileEditorModal } from '@/components/dashboard/ProfileEditorModal';
import Link from 'next/link';

export interface ParentDashboardClientProps {
  user: any;
  parentProfile?: any;
  followedTeachers: Array<{
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    wilaya?: string | null;
    teacherProfile?: {
      id: string;
      headline?: string | null;
    } | null;
  }>;
}

export const ParentDashboardClient: React.FC<ParentDashboardClientProps> = ({
  user,
  parentProfile,
  followedTeachers,
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
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                لوحة ولي الأمر: {user.fullName}
                <ShieldCheck className="w-5 h-5 text-amber-400" />
              </h1>
              <p className="text-xs text-teal-300 font-semibold pt-1">
                الولاية: {user.wilaya || 'الجزائر'} | ميزانية الدروس المفضلة: {parentProfile?.budgetRange || 'حسب الاتفاق'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setEditProfileOpen(true)}
              className="gap-2 border-slate-700 text-stone-200 hover:bg-slate-800 font-bold"
            >
              <Edit3 className="w-4 h-4 text-teal-400" /> تعديل بيانات الولي
            </Button>
            <Badge variant="teal" size="md" className="font-bold">
              حساب ولي أمر
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Direct Discovery & Parent Tools */}
          <div className="space-y-6">
            <div className="clean-card p-6 space-y-4 bg-[#111D38] border border-[#1E3A5F]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-teal-400" /> دليل الأساتذة المعتمدين
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                ابحث بنفسك في قاعدة بيانات الأساتذة المعتمدين حسب المادة، الولاية، ونوع التدريس (حضوري / عن بعد).
              </p>
              <div className="pt-1">
                <Link href="/teachers" className="block">
                  <Button variant="primary" size="md" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold gap-2">
                    <Search className="w-4 h-4" /> تصفح دليل الأساتذة (58 ولاية)
                  </Button>
                </Link>
              </div>
            </div>

            <div className="clean-card p-6 space-y-4 bg-[#111D38] border border-[#1E3A5F]">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-teal-400" /> المتجر التعليمي
                </h3>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                تصفح ملخصات الدروس، حقائب البكالوريا، والكتب مع إمكانية التواصل مباشرة مع الأساتذة عبر واتساب أو تليغرام.
              </p>
              <Link href="/products" className="block">
                <Button variant="outline" size="sm" className="w-full border-slate-700 hover:bg-slate-800 text-teal-300 font-bold text-xs">
                  زيارة المتجر التعليمي
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: Followed Teachers Hub */}
          <div className="lg:col-span-2 space-y-6">
            <div className="clean-card p-6 space-y-4 bg-[#111D38] border border-[#1E3A5F]">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-400" /> الأساتذة المتابعون ({followedTeachers.length})
                </h3>
                <Link href="/teachers">
                  <Button variant="outline" size="sm" className="border-slate-700 text-teal-300 text-xs">
                    استكشاف المزيد من الأساتذة
                  </Button>
                </Link>
              </div>

              {followedTeachers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {followedTeachers.map((t) => (
                    <div key={t.id} className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
                      <div className="flex items-start gap-3">
                        <AvatarFallback
                          src={t.avatarUrl}
                          name={t.fullName}
                          size={48}
                          className="w-12 h-12 rounded-xl object-cover border border-teal-500 shadow-sm"
                        />
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            {t.fullName}
                          </h4>
                          <span className="text-[11px] text-teal-300 block">{t.teacherProfile?.headline || t.wilaya || 'أستاذ معتمد'}</span>
                        </div>
                      </div>

                      {t.teacherProfile && (
                        <Link href={`/teachers/${t.teacherProfile.id}`} className="block">
                          <Button variant="outline" size="sm" className="w-full border-slate-700 hover:bg-slate-800 text-stone-200 font-bold text-xs">
                            عرض الملف الشخصي والتواصل
                          </Button>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-stone-400 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
                  <p>لم تقم بمتابعة أي أستاذ بعد. يمكنك تصفح دليل الأساتذة ومتابعة الأساتذة الأنسب لدراسة العائلة.</p>
                  <Link href="/teachers" className="inline-block">
                    <Button variant="outline" size="sm" className="border-slate-700 text-teal-300 text-xs">
                      تصفح الأساتذة الآن
                    </Button>
                  </Link>
                </div>
              )}
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

