import React from 'react';

export default function StudentDashboardLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-pulse" dir="rtl">
      <div className="h-24 rounded-2xl bg-[#0A1628]/60 border border-slate-800 p-6 space-y-3">
        <div className="h-6 w-48 bg-slate-800/80 rounded-lg" />
        <div className="h-4 w-64 bg-slate-800/50 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-[#0B1E33]/40 border border-slate-800/60 p-4 space-y-2">
            <div className="h-4 w-20 bg-slate-800/80 rounded" />
            <div className="h-7 w-12 bg-slate-800/60 rounded" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl bg-[#0B1E33]/40 border border-slate-800/60 p-6 space-y-4">
        <div className="h-5 w-36 bg-slate-800/80 rounded" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-slate-800/30 border border-slate-700/30" />
        ))}
      </div>
    </div>
  );
}
