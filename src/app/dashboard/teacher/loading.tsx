import React from 'react';

export default function TeacherDashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-pulse" dir="rtl">
      {/* Welcome / Stats skeleton */}
      <div className="rounded-2xl bg-[#0A1628]/60 border border-slate-800 p-6 space-y-4">
        <div className="h-7 w-56 bg-slate-800/80 rounded-lg" />
        <div className="h-4 w-72 bg-slate-800/50 rounded-lg" />
      </div>

      {/* KPI row skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-[#0B1E33]/40 border border-slate-800/60 p-5 space-y-3">
            <div className="h-4 w-24 bg-slate-800/80 rounded" />
            <div className="h-8 w-16 bg-slate-800/60 rounded" />
          </div>
        ))}
      </div>

      {/* Products manager skeleton */}
      <div className="rounded-2xl bg-[#0B1E33]/40 border border-slate-800/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-40 bg-slate-800/80 rounded" />
          <div className="h-8 w-28 bg-teal-900/40 rounded-xl" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-slate-800/40 border border-slate-700/40" />
        ))}
      </div>

      {/* Inquiries table skeleton */}
      <div className="rounded-2xl bg-[#0B1E33]/40 border border-slate-800/60 p-6 space-y-3">
        <div className="h-5 w-48 bg-slate-800/80 rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-slate-800/30 border border-slate-700/30" />
        ))}
      </div>
    </div>
  );
}
