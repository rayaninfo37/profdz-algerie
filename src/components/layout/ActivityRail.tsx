'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, Star, Tag, TrendingUp, Zap, Award, BookOpen, MessageSquare, User } from 'lucide-react';
import AvatarFallback from '@/components/common/AvatarFallback';

interface ActivityEvent {
  id: string;
  type: 'post' | 'review' | 'product' | 'teacher';
  label: string;
  name: string;
  href: string;
  time: string;
  extra?: string;
}

interface TrendingTeacher {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  subject?: string;
  rating: number;
  reviewCount: number;
  activityCount: number;
}

interface ActivityData {
  events: ActivityEvent[];
  trendingTeachers: TrendingTeacher[];
  popularTags: string[];
}

const eventIcon = (type: string) => {
  switch (type) {
    case 'post': return <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />;
    case 'review': return <Star className="w-3.5 h-3.5 text-amber-400" />;
    case 'product': return <BookOpen className="w-3.5 h-3.5 text-emerald-400" />;
    case 'teacher': return <User className="w-3.5 h-3.5 text-violet-400" />;
    default: return <Zap className="w-3.5 h-3.5 text-slate-400" />;
  }
};

const eventDot = (type: string) => {
  switch (type) {
    case 'post': return 'bg-cyan-400';
    case 'review': return 'bg-amber-400';
    case 'product': return 'bg-emerald-400';
    case 'teacher': return 'bg-violet-400';
    default: return 'bg-slate-500';
  }
};

export const ActivityRail = () => {
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/activities')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <aside
      className="hidden xl:flex flex-col shrink-0 w-64 sticky top-0 h-screen overflow-y-auto z-20"
      style={{ background: 'linear-gradient(180deg, #06101D 0%, #070E1C 100%)' }}
    >
      <div className="flex flex-col gap-5 p-4">

        {/* Live Activity Stream */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <h3 className="text-[11px] text-slate-300 font-black uppercase tracking-widest">النشاط الأخير</h3>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1,2,3,4].map((i) => (
                <div key={i} className="h-12 bg-slate-900/60 rounded-xl animate-pulse border border-white/5" />
              ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              {(data?.events || []).slice(0, 6).map((event) => (
                <Link key={event.id} href={event.href}>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/40 border border-white/5 hover:border-cyan-500/20 hover:bg-slate-900/70 transition-all group">
                    <div className="mt-0.5 shrink-0">
                      {eventIcon(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-slate-400 leading-tight">
                        <span className="text-slate-200 font-bold group-hover:text-cyan-300 transition-colors truncate block max-w-full">
                          {event.name}
                        </span>
                        {event.label}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${eventDot(event.type)}`} />
                        <span className="text-[10px] text-slate-600">{event.time}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Trending Teachers */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            <h3 className="text-[11px] text-slate-300 font-black uppercase tracking-widest">الأكثر تفاعلاً</h3>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map((i) => (
                <div key={i} className="h-14 bg-slate-900/60 rounded-xl animate-pulse border border-white/5" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {(data?.trendingTeachers || []).slice(0, 4).map((teacher, idx) => (
                <Link key={teacher.id} href={`/teachers/${teacher.id}`}>
                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-900/40 border border-white/5 hover:border-cyan-500/20 hover:bg-slate-900/70 transition-all group">
                    <span className={`text-[11px] font-black w-5 shrink-0 text-center ${
                      idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-slate-600'
                    }`}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <AvatarFallback
                      src={teacher.avatarUrl}
                      name={teacher.fullName}
                      size={28}
                      className="w-7 h-7 rounded-lg border border-cyan-500/20 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-slate-200 font-bold group-hover:text-cyan-300 transition-colors truncate">
                        {teacher.fullName}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                        <span className="text-[10px] text-slate-500">
                          {teacher.rating.toFixed(1)} • {teacher.reviewCount} تقييم
                        </span>
                      </div>
                    </div>
                    {idx === 0 && <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Popular Tags */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-3.5 h-3.5 text-teal-400" />
            <h3 className="text-[11px] text-slate-300 font-black uppercase tracking-widest">المواد الشائعة</h3>
          </div>

          {loading ? (
            <div className="flex flex-wrap gap-1.5">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="h-6 w-14 bg-slate-900/60 rounded-full animate-pulse border border-white/5" />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {(data?.popularTags || []).slice(0, 12).map((tag, i) => (
                <Link key={tag} href={`/teachers?subject=${encodeURIComponent(tag)}`}>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border hover:scale-105 ${
                    i % 3 === 0
                      ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20 hover:bg-cyan-500/20 hover:border-cyan-500/40'
                      : i % 3 === 1
                      ? 'bg-teal-500/10 text-teal-300 border-teal-500/20 hover:bg-teal-500/20 hover:border-teal-500/40'
                      : 'bg-slate-700/50 text-slate-300 border-slate-600/30 hover:bg-slate-600/50 hover:border-slate-500/50'
                  }`}>
                    {tag}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Platform stats footer */}
        <section className="mt-auto">
          <div className="bg-gradient-to-br from-cyan-600/10 to-teal-600/5 border border-cyan-500/15 rounded-xl p-3 space-y-2">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center">إحصائيات المنصة</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'أستاذ', icon: '👨‍🏫' },
                { label: 'ولاية', icon: '🗺️' },
                { label: 'منتج', icon: '📚' },
                { label: 'مؤسسة', icon: '🏫' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <span className="text-sm">{s.icon}</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </aside>
  );
};
