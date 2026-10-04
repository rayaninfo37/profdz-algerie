import React from 'react';

export default function TeacherProfileLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-pulse" dir="rtl">
      {/* Hero card skeleton */}
      <div className="rounded-3xl bg-[#0A1628]/70 border border-slate-800 p-8 flex items-start gap-6">
        <div className="w-24 h-24 rounded-2xl bg-slate-800/80 shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-7 w-48 bg-slate-800/80 rounded-lg" />
          <div className="h-4 w-64 bg-slate-800/50 rounded-lg" />
          <div className="flex gap-2 pt-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-6 w-20 rounded-full bg-slate-800/60" />
            ))}
          </div>
        </div>
      </div>

      {/* About section skeleton */}
      <div className="rounded-2xl bg-[#0B1E33]/40 border border-slate-800/60 p-6 space-y-3">
        <div className="h-5 w-32 bg-slate-800/80 rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-3 bg-slate-800/40 rounded" />
        ))}
      </div>

      {/* Reviews skeleton */}
      <div className="rounded-2xl bg-[#0B1E33]/40 border border-slate-800/60 p-6 space-y-4">
        <div className="h-5 w-40 bg-slate-800/80 rounded" />
        {[1, 2].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-slate-800/30 border border-slate-700/30" />
        ))}
      </div>
    </div>
  );
}
