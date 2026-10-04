import React from 'react';

export default function AdminDashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-pulse" dir="rtl">
      {/* KPI Matrix skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-[#0B1E33]/40 border border-slate-800/60 p-4 space-y-3">
            <div className="h-4 w-20 bg-slate-800/70 rounded" />
            <div className="h-7 w-14 bg-slate-800/60 rounded" />
          </div>
        ))}
      </div>

      {/* Tab bar skeleton */}
      <div className="flex gap-2 pb-1 border-b border-slate-800">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 w-32 rounded-xl bg-slate-800/60" />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-2xl bg-[#111D38] border border-[#1E3A5F] p-6 space-y-4">
        <div className="h-6 w-48 bg-slate-800/80 rounded" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-slate-800/30 border border-slate-700/30" />
        ))}
      </div>
    </div>
  );
}
