import React from 'react';

export default function ProductsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse" dir="rtl">
      {/* Header skeleton */}
      <div className="h-28 rounded-3xl bg-[#0A1628]/60 border border-slate-800 p-6 flex flex-col justify-center space-y-3">
        <div className="h-6 w-48 bg-slate-800/80 rounded-lg" />
        <div className="h-4 w-72 bg-slate-800/50 rounded-lg" />
      </div>

      {/* Filter bar */}
      <div className="h-16 rounded-2xl bg-[#0A1628]/40 border border-slate-800/60 p-3 flex items-center gap-3">
        <div className="h-10 flex-1 bg-slate-800/60 rounded-xl" />
        <div className="h-10 w-32 bg-slate-800/60 rounded-xl" />
        <div className="h-10 w-32 bg-slate-800/60 rounded-xl" />
      </div>

      {/* Product cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-80 rounded-2xl bg-[#0B1E33]/40 border border-slate-800/60 overflow-hidden flex flex-col justify-between">
            <div className="h-44 bg-slate-800/70" />
            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-slate-800/80 rounded" />
                <div className="h-3 w-1/2 bg-slate-800/50 rounded" />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
                <div className="h-5 w-16 bg-teal-900/50 rounded" />
                <div className="h-8 w-20 bg-slate-800/80 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
