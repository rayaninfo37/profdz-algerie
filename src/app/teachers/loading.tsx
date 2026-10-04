import React from 'react';

export default function TeachersLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse" dir="rtl">
      {/* Header skeleton */}
      <div className="h-28 rounded-3xl bg-[#0A1628]/60 border border-slate-800 p-6 flex flex-col justify-center space-y-3">
        <div className="h-6 w-48 bg-slate-800/80 rounded-lg" />
        <div className="h-4 w-72 bg-slate-800/50 rounded-lg" />
      </div>

      {/* Filter bar skeleton */}
      <div className="h-16 rounded-2xl bg-[#0A1628]/40 border border-slate-800/60 p-3 flex items-center gap-3">
        <div className="h-10 flex-1 bg-slate-800/60 rounded-xl" />
        <div className="h-10 w-32 bg-slate-800/60 rounded-xl" />
        <div className="h-10 w-32 bg-slate-800/60 rounded-xl" />
      </div>

      {/* Teachers cards grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-64 rounded-2xl bg-[#0B1E33]/40 border border-slate-800/60 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-32 bg-slate-800/80 rounded" />
                <div className="h-3 w-20 bg-slate-800/50 rounded" />
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-3 w-full bg-slate-800/50 rounded" />
              <div className="h-3 w-4/5 bg-slate-800/40 rounded" />
            </div>
            <div className="pt-4 flex items-center justify-between border-t border-slate-800/50">
              <div className="h-8 w-24 bg-slate-800/70 rounded-xl" />
              <div className="h-8 w-24 bg-teal-900/40 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
