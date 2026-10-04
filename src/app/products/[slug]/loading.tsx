import React from 'react';

export default function ProductPageLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-pulse" dir="rtl">
      {/* Cover image skeleton */}
      <div className="w-full h-64 rounded-3xl bg-slate-800/60" />

      {/* Title & meta skeleton */}
      <div className="space-y-3">
        <div className="h-8 w-2/3 bg-slate-800/80 rounded-xl" />
        <div className="h-4 w-40 bg-slate-800/50 rounded" />
        <div className="flex gap-3 pt-1">
          {[1, 2].map((i) => (
            <div key={i} className="h-7 w-24 rounded-full bg-slate-800/60" />
          ))}
        </div>
      </div>

      {/* Description skeleton */}
      <div className="rounded-2xl bg-[#0B1E33]/40 border border-slate-800/60 p-6 space-y-3">
        <div className="h-5 w-32 bg-slate-800/80 rounded" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-3 bg-slate-800/40 rounded w-full" />
        ))}
      </div>

      {/* CTA buttons skeleton */}
      <div className="flex gap-3">
        <div className="h-12 flex-1 rounded-xl bg-teal-900/40" />
        <div className="h-12 flex-1 rounded-xl bg-slate-800/50" />
      </div>
    </div>
  );
}
