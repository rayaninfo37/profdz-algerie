import React from 'react';
import { prisma } from '@/lib/db';
import { School, MapPin, ExternalLink, Sparkles } from 'lucide-react';
import Link from 'next/link';
import AvatarFallback from '@/components/common/AvatarFallback';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

export const revalidate = 60;

export default async function AcademicsPage() {
  const academics = await prisma.teacherProfile.findMany({
    where: {
      subscriptionState: { in: ['FREE_ACTIVE', 'PRO_ACTIVE'] },
      user: {
        isFrozen: false,
        softDeletedAt: null,
      },
      OR: [
        { headline: { contains: 'جامع' } },
        { headline: { contains: 'دكتور' } },
        { headline: { contains: 'استاذ محاضر' } },
        { headline: { contains: 'باحث' } },
        { qualifications: { contains: 'دكتوراه' } },
        { qualifications: { contains: 'ماستر' } },
        { qualifications: { contains: 'جامعة' } },
        { user: { role: 'ACADEMIC' } },
      ],
    },
    select: {
      id: true,
      headline: true,
      bio: true,
      subjects: true,
      isVerified: true,
      experienceYears: true,
      user: {
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
          wilaya: true,
          role: true,
        },
      },
    },
    take: 24,
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-7xl mx-auto space-y-10 text-white" dir="rtl">
      {/* Editorial Header with Authentic University Atmosphere - Crystal Clear */}
        <div className="relative rounded-3xl min-h-[240px] flex items-center border border-sky-400/40 p-8 sm:p-12 overflow-hidden shadow-2xl text-white bg-slate-950">
          <div className="absolute inset-0 z-0">
            <img
              src="/media/education/academic_library.jpg"
              alt="نخبة الأكاديميين والباحثين"
              className="w-full h-full object-cover object-center filter brightness-[0.88] contrast-[1.08]"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-[#06101D]/80 via-[#0A1B33]/50 to-transparent" />
          </div>
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 text-xs font-bold uppercase tracking-wider shadow-sm">
              <School className="w-4 h-4 text-cyan-400" />
              <span>التعليم العالي والبحث العلمي 🇩🇿</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              نخبة الأكاديميين، الدكاترة، والأساتذة الباحثين
            </h1>
            <p className="text-slate-200 text-xs sm:text-sm leading-relaxed font-medium">
              مساحة مستقلة للكفاءات الجامعية والباحثين في الجزائر لربط البحوث، المذكرات، الملخصات الجامعية، والإشراف الأكاديمي مع طلبة الجامعات والدراسات العليا.
            </p>
          </div>
        </div>

        {/* Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {academics.map((academic) => {
            let subjectsList: string[] = [];
            try {
              subjectsList = JSON.parse(academic.subjects || '[]');
            } catch {
              subjectsList = [];
            }

            return (
              <div
                key={academic.id}
                className="bg-[#0A1628]/85 border border-cyan-400/25 hover:border-teal-400/60 rounded-2xl p-5 sm:p-6 shadow-xl hover:shadow-[0_0_25px_rgba(45,212,191,0.25)] backdrop-blur-xl transition-all flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <AvatarFallback
                      src={academic.user.avatarUrl}
                      name={academic.user.fullName}
                      size={60}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-teal-500/50 shadow-md group-hover:scale-105 transition-transform"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-lg text-white group-hover:text-teal-300 transition-colors">
                          {academic.user.fullName}
                        </h3>
                        {academic.isVerified && <VerifiedBadge size="sm" />}
                      </div>
                      <p className="text-xs text-teal-400 font-medium line-clamp-1 mt-0.5">
                        {academic.headline || 'أستاذ محاضر وباحث جامعي'}
                      </p>
                      <div className="flex items-center gap-2 text-stone-400 text-[11px] mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>{academic.user.wilaya || 'الجزائر'}</span>
                        {academic.experienceYears > 0 && (
                          <>
                            <span>•</span>
                            <span>{academic.experienceYears} سنوات خبرة</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {academic.bio && (
                    <p className="text-xs text-stone-300 line-clamp-3 leading-relaxed">
                      {academic.bio}
                    </p>
                  )}

                  {subjectsList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {subjectsList.slice(0, 3).map((sub, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] px-2.5 py-0.5 rounded-lg bg-slate-800/80 text-teal-300 border border-slate-700 font-medium"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-stone-400 flex items-center gap-1 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    كفاءة جامعية موثقة
                  </span>
                  <Link
                    href={`/teachers/${academic.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md"
                  >
                    عرض الملف الأكاديمي
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {academics.length === 0 && (
          <div className="text-center py-16 bg-[#0f172a] rounded-3xl border border-slate-800 p-8 space-y-3">
            <School className="w-12 h-12 text-teal-400 mx-auto opacity-60" />
            <h3 className="text-lg font-bold text-white">لا يوجد أكاديميون مسجلون حالياً بهذه المعايير</h3>
            <p className="text-xs text-stone-400 max-w-md mx-auto">
              إذا كنت أستاذاً جامعياً أو باحثاً أكاديمياً، يمكنك الانضمام لمنصة قراتي وتوثيق تخصصك لمساعدة آلاف الطلبة الجامعيين.
            </p>
          </div>
        )}
      </div>
  );
}
