import React from 'react';
import { prisma } from '@/lib/db';
import { GraduationCap, BookOpen, Search, MapPin, Award, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import AvatarFallback from '@/components/common/AvatarFallback';

export const revalidate = 60;

export default async function PupilsPage({
  searchParams,
}: {
  searchParams?: { q?: string; wilaya?: string; level?: string };
}) {
  const query = searchParams?.q?.toLowerCase() || '';
  const wilaya = searchParams?.wilaya || '';
  const level = searchParams?.level || '';

  // Query pupils (Primary, Middle, Secondary stages)
  const pupils = await prisma.user.findMany({
    where: {
      role: { in: ['STUDENT', 'PUPIL'] },
      studentProfile: {
        studentType: { in: ['PUPIL_PRIMARY', 'PUPIL_MIDDLE', 'PUPIL_SECONDARY'] },
      },
      ...(wilaya ? { wilaya: { contains: wilaya } } : {}),
      ...(query ? { fullName: { contains: query } } : {}),
    },
    select: {
      id: true,
      fullName: true,
      avatarUrl: true,
      wilaya: true,
      studentProfile: {
        select: {
          id: true,
          studentType: true,
          educationLevel: true,
          interests: true,
        },
      },
      createdAt: true,
    },
    take: 24,
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 text-white" dir="rtl">
      {/* Pupils Section Header with Authentic Dedicated School Visual Identity */}
      <div className="relative rounded-3xl min-h-[220px] flex items-center border border-sky-400/40 p-8 sm:p-10 overflow-hidden shadow-2xl text-white bg-slate-950">
        <div className="absolute inset-0 z-0">
          <img
            src="/media/pupils/algerian_pupils.jpg"
            alt="تلاميذ الأطوار التعليمية في الجزائر"
            className="w-full h-full object-cover object-center filter brightness-[0.95] contrast-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-[#06101D]/75 via-[#0A1B33]/40 to-transparent" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 w-full">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 text-xs font-bold uppercase tracking-wider shadow-sm">
              <GraduationCap className="w-4 h-4 text-cyan-400" />
              <span>التعليم المدرسي والأطوار العامة 🇩🇿</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              تلاميذ الأطوار العامة (ابتدائي، متوسط، ثانوي)
            </h1>
            <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-medium">
              فضاء مخصص لتلاميذ المراحل الابتدائية والمتوسطة والثانوية للتواصل، متابعة الدروس والملخصات، والتحضير لشهادات BEM و BAC تحت إشراف نخبة الأساتذة والأولياء.
            </p>
          </div>

          <div className="p-4 bg-slate-950/80 border border-sky-400/30 rounded-2xl text-xs flex flex-col gap-1 shadow-xl shrink-0">
            <span className="text-slate-400 text-[11px]">التلاميذ المسجلون:</span>
            <strong className="text-sky-300 font-mono text-xl font-black">{pupils.length} تلميذ</strong>
            <span className="text-[10px] text-teal-300 font-bold flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> متابعة ودعم مستمر
            </span>
          </div>
        </div>
      </div>

      {/* Pupils Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pupils.map((pupil) => {
          let interestsList: string[] = [];
          try {
            interestsList = JSON.parse(pupil.studentProfile?.interests || '[]');
          } catch {
            interestsList = [];
          }

          const stageLabel = pupil.studentProfile?.studentType === 'PUPIL_SECONDARY'
            ? 'طور ثانوي'
            : pupil.studentProfile?.studentType === 'PUPIL_MIDDLE'
            ? 'طور متوسط'
            : 'طور ابتدائي';

          return (
            <div
              key={pupil.id}
              className="bg-[#0B132B]/85 border border-cyan-500/20 hover:border-cyan-400/50 rounded-2xl p-6 shadow-xl hover:shadow-cyan-500/10 transition-all flex flex-col justify-between group backdrop-blur-md"
            >
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <AvatarFallback
                    src={pupil.avatarUrl}
                    name={pupil.fullName}
                    size={54}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-cyan-500/40 shadow-md group-hover:border-cyan-400 transition-colors"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base text-white group-hover:text-cyan-300 transition-colors truncate">
                      {pupil.fullName}
                    </h3>
                    <p className="text-xs text-cyan-400 font-medium mt-0.5">
                      {pupil.studentProfile?.educationLevel || stageLabel}
                    </p>
                    <div className="flex items-center gap-2 text-slate-400 text-[11px] mt-1">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{pupil.wilaya || 'الجزائر'}</span>
                    </div>
                  </div>
                </div>

                {interestsList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {interestsList.slice(0, 3).map((item, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2.5 py-0.5 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-800/50 font-medium"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  {stageLabel}
                </span>
                <Link
                  href={`/students/${pupil.id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
                >
                  عرض الملف
                </Link>
              </div>
            </div>
            );
          })}
        </div>

        {pupils.length === 0 && (
          <div className="text-center py-16 bg-[#0B132B]/85 rounded-2xl border border-cyan-500/20 p-8 space-y-3">
            <GraduationCap className="w-12 h-12 text-cyan-400 mx-auto opacity-60" />
            <h3 className="text-lg font-bold text-white">لا يوجد تلاميذ مسجلون حالياً بهذه المعايير</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              يمكن للتلاميذ التسجيل واختيار طورهم الدراسي للاستفادة من بنك التمارين والملخصات.
            </p>
          </div>
        )}
      </div>
    );
}
