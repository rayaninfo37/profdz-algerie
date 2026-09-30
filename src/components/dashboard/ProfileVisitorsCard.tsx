'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Clock, Eye, ShieldCheck, ChevronLeft, Sparkles } from 'lucide-react';
import AvatarFallback from '@/components/common/AvatarFallback';
import { useLocale } from '@/context/LocaleContext';

interface Visitor {
  id: string;
  name: string;
  role: string;
  avatarUrl: string | null;
  profileUrl: string | null;
  viewedAt: string;
  timeAgo: string;
}

interface ProfileVisitorsCardProps {
  teacherId?: string;
  personaType?: string;
  initialVisitors?: Visitor[];
  totalViews?: number;
}

export const ProfileVisitorsCard: React.FC<ProfileVisitorsCardProps> = ({
  teacherId,
  personaType = 'TEACHER',
  initialVisitors,
  totalViews: propTotalViews,
}) => {
  const { t } = useLocale();
  const [visitors, setVisitors] = useState<Visitor[]>(initialVisitors || []);
  const [totalViews, setTotalViews] = useState<number>(propTotalViews ?? 0);
  const [loading, setLoading] = useState<boolean>(!initialVisitors);

  useEffect(() => {
    if (initialVisitors) return;
    const url = personaType === 'TEACHER' ? '/api/teachers/visitors' : `/api/profile/visitors?type=${personaType}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.visitors) {
          setVisitors(data.visitors);
          setTotalViews(data.totalViews || data.visitors.length);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [initialVisitors, personaType]);

  return (
    <div className="bg-[#0f172a]/95 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shadow-inner">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {t.visitors.whoViewedMyProfile}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800 font-semibold">
                AI Visitor Intelligence
              </span>
            </h3>
            <p className="text-xs text-stone-400">
              {t.visitors.recentVisitors}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl">
          <Eye className="w-4 h-4 text-teal-400" />
          <span className="text-xs font-bold text-white">{totalViews}</span>
          <span className="text-[10px] text-stone-400">{t.visitors.totalViews}</span>
        </div>
      </div>

      {/* Visitors List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-2xl animate-pulse">
              <div className="w-10 h-10 rounded-full bg-slate-800" />
              <div className="flex-1 space-y-1.5">
                <div className="w-24 h-3 bg-slate-800 rounded" />
                <div className="w-16 h-2 bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : visitors.length > 0 ? (
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {visitors.map((visitor) => (
            <div
              key={visitor.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-teal-500/30 hover:bg-slate-900 transition-all group"
            >
              <div className="flex items-center gap-3">
                <AvatarFallback
                  src={visitor.avatarUrl}
                  name={visitor.name}
                  size={40}
                  className="w-10 h-10 rounded-full object-cover border border-teal-500/30 group-hover:scale-105 transition-transform"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors">
                      {visitor.name}
                    </span>
                    {visitor.role === 'TEACHER' || visitor.role === 'ACADEMIC' ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-stone-300 font-semibold uppercase">
                      {visitor.role}
                    </span>
                    <span className="text-[10px] text-stone-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {visitor.timeAgo}
                    </span>
                  </div>
                </div>
              </div>

              {visitor.profileUrl && (
                <Link
                  href={visitor.profileUrl}
                  className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-teal-600 text-stone-400 hover:text-white transition-all"
                  title="عرض الحساب"
                >
                  <ChevronLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
                </Link>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 px-4 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl">
          <Sparkles className="w-8 h-8 text-teal-400/50 mx-auto mb-2" />
          <p className="text-xs text-stone-300 font-medium">
            {t.visitors.noVisitorsYet}
          </p>
          <p className="text-[11px] text-stone-400 mt-1">
            سيظهر هنا كل من يستعرض ملفك التعليمي من الطلاب، الأولياء، والأساتذة الزملاء.
          </p>
        </div>
      )}
    </div>
  );
};
