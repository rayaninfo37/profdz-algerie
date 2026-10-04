import React from 'react';

export default function FeedLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-pulse" dir="rtl">
      {/* Create post box skeleton */}
      <div className="h-32 rounded-2xl bg-[#0A1628]/60 border border-slate-800 p-5 flex flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 shrink-0" />
          <div className="h-10 flex-1 bg-slate-800/60 rounded-xl" />
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-slate-800/60">
          <div className="h-6 w-24 bg-slate-800/50 rounded" />
          <div className="h-8 w-20 bg-teal-900/50 rounded-lg" />
        </div>
      </div>

      {/* Feed post cards */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-2xl bg-[#0B1E33]/40 border border-slate-800/60 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800/80 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-36 bg-slate-800/80 rounded" />
              <div className="h-3 w-24 bg-slate-800/50 rounded" />
            </div>
          </div>
          <div className="space-y-2 pt-2">
            <div className="h-3.5 w-full bg-slate-800/60 rounded" />
            <div className="h-3.5 w-5/6 bg-slate-800/50 rounded" />
            <div className="h-3.5 w-2/3 bg-slate-800/40 rounded" />
          </div>
          <div className="h-56 bg-slate-800/50 rounded-xl" />
          <div className="flex items-center gap-6 pt-3 border-t border-slate-800/50">
            <div className="h-6 w-16 bg-slate-800/60 rounded" />
            <div className="h-6 w-16 bg-slate-800/60 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
