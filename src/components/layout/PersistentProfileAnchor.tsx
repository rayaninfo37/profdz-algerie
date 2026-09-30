'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AvatarFallback from '@/components/common/AvatarFallback';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { LayoutDashboard, Sparkles, X, Users, Heart, BookOpen, Building2 } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';

export const PersistentProfileAnchor = () => {
  const { t } = useLocale();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setCurrentUser(data.user);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (closed || loading) return null;

  // Guest card
  if (!currentUser) {
    return (
      <aside aria-label="Identity Anchor" className="hidden lg:block fixed bottom-6 right-6 z-40 animate-fadeIn select-none">
        <div className="w-72 bg-[#0C2B40]/85 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-sky-400/30 hover:border-sky-400/60 transition-all duration-300 relative group text-white">
          <button
            onClick={() => setClosed(true)}
            className="absolute top-2.5 left-2.5 w-5 h-5 rounded-full bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center text-[10px] border border-white/10 transition-colors"
            title={t.common.cancel}
          >
            <X className="w-3 h-3" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-teal-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300 shadow-md shrink-0">
              <Sparkles className="w-5 h-5 text-sky-300 animate-pulse" />
            </div>
            <div className="space-y-0.5 min-w-0 flex-1">
              <span className="text-[9px] font-bold text-sky-400 uppercase tracking-wider block">PROF DZ</span>
              <h4 className="text-xs font-black text-white truncate">انضم إلى PROF DZ</h4>
              <p className="text-[10px] text-sky-200/70 truncate">مجتمع تعليمي وطني موثوق 🇩🇿</p>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center gap-2">
            <Link
              href="/register"
              className="flex-1 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-500 hover:to-sky-500 text-white text-xs font-bold text-center transition-all shadow-md shadow-sky-500/20"
            >
              {t.common.register}
            </Link>
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-white/10 text-sky-200 text-xs font-bold transition-all"
            >
              {t.common.login}
            </Link>
          </div>
        </div>
      </aside>
    );
  }

  // Determine user role and corresponding links/labels
  const isTeacher = currentUser.role === 'TEACHER' || currentUser.role === 'ACADEMIC';
  const isStudent = currentUser.role === 'STUDENT' || currentUser.role === 'PUPIL';
  const isParent = currentUser.role === 'PARENT';

  const roleLabel = isTeacher
    ? 'أستاذ معتمد'
    : isStudent
    ? 'طالب / تلميذ'
    : isParent
    ? 'ولي أمر'
    : currentUser.role;

  const dashboardHref = isTeacher
    ? '/dashboard/teacher'
    : isStudent
    ? '/dashboard/student'
    : isParent
    ? '/dashboard/parent'
    : '/admin';

  const profileHref = isTeacher && currentUser.teacherProfile
    ? `/teachers/${currentUser.teacherProfile.id}`
    : dashboardHref;

  return (
    <aside aria-label="Identity Anchor" className="hidden lg:block fixed bottom-6 right-6 z-40 animate-fadeIn select-none">
      <div className="w-72 bg-[#0C2B40]/85 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-sky-400/30 hover:border-sky-400/60 transition-all duration-300 relative group text-white">
        <button
          onClick={() => setClosed(true)}
          className="absolute top-2.5 left-2.5 w-5 h-5 rounded-full bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center text-[10px] border border-white/10 transition-colors"
          title={t.common.cancel}
        >
          <X className="w-3 h-3" />
        </button>

        {/* Identity Header */}
        <div className="flex items-center gap-3">
          <Link href={profileHref} className="relative shrink-0 group/avatar">
            <AvatarFallback
              src={currentUser.avatarUrl}
              name={currentUser.fullName}
              size={48}
              className="w-12 h-12 rounded-xl object-cover border-2 border-sky-400/50 shadow-md group-hover/avatar:border-sky-300 transition-all"
            />
            {currentUser.teacherProfile?.isVerified && (
              <div className="absolute -bottom-1 -right-1">
                <VerifiedBadge size="sm" />
              </div>
            )}
          </Link>

          <div className="flex-1 min-w-0 space-y-0.5">
            <Link href={profileHref} className="block group-hover:text-sky-300 transition-colors">
              <h4 className="text-xs font-black text-white truncate flex items-center gap-1">
                {currentUser.fullName}
              </h4>
            </Link>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] px-2 py-0.5 rounded-md bg-sky-500/20 border border-sky-400/30 text-sky-200 font-bold uppercase tracking-wider">
                {roleLabel}
              </span>
              {currentUser.wilaya && (
                <span className="text-[10px] text-sky-200/70 truncate">
                  🇩🇿 {currentUser.wilaya}
                </span>
              )}
            </div>
          </div>
        </div>



        {/* Direct Action Link */}
        <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
          <Link
            href={profileHref}
            className="flex-1 py-1.5 px-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-white/10 text-[11px] font-bold text-center text-sky-200 hover:text-white transition-all"
          >
            الملف الشخصي
          </Link>
          <Link
            href={dashboardHref}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-500 hover:to-sky-500 text-white text-[11px] font-bold transition-all shadow-md shadow-sky-500/20"
          >
            <LayoutDashboard className="w-3 h-3" />
            لوحة التحكم
          </Link>
        </div>
      </div>
    </aside>
  );
};
