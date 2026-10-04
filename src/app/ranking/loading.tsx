import React from 'react';

export default function RankingPageLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-pulse" dir="rtl">
      {/* Header skeleton */}
      <div className="h-10 w-64 bg-slate-800/80 rounded-xl mx-auto" />
      <div className="h-4 w-48 bg-slate-800/50 rounded mx-auto" />

      {/* Top 3 podium skeleton */}
      <div className="flex items-end justify-center gap-4 py-8">
        {[80, 100, 70].map((h, i) => (
          <div
            key={i}
            className="rounded-2xl bg-slate-800/40 border border-slate-700/40"
            style={{ height: `${h}px`, width: '100px' }}
          />
        ))}
      </div>

      {/* Ranking list skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-[#0B1E33]/40 border border-slate-800/60">
            <div className="w-8 h-8 rounded-full bg-slate-800/70 shrink-0" />
            <div className="w-12 h-12 rounded-xl bg-slate-800/60 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 bg-slate-800/80 rounded" />
              <div className="h-3 w-24 bg-slate-800/50 rounded" />
            </div>
            <div className="h-6 w-16 rounded-full bg-amber-900/40" />
          </div>
        ))}
      </div>
    </div>
  );
}
