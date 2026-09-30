'use client';

import React, { useState, useEffect } from 'react';
import { Eye, BookOpen, Clock, Users, ChevronDown, Sparkles } from 'lucide-react';
import AvatarFallback from '@/components/common/AvatarFallback';
import { useLocale } from '@/context/LocaleContext';

interface ProductItem {
  id: string;
  title: string;
  slug: string;
}

interface ProductVisitor {
  id: string;
  visitorId?: string | null;
  visitorName: string;
  visitorRole: string;
  visitorAvatar?: string | null;
  relativeTimeStr: string;
}

export const ProductVisitorsAnalytics = () => {
  const { t } = useLocale();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [visitors, setVisitors] = useState<ProductVisitor[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [uniqueViews, setUniqueViews] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchViews = (pId?: string) => {
    setLoading(true);
    const url = pId ? `/api/products/seller-views?productId=${pId}` : '/api/products/seller-views';
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.products) setProducts(data.products);
        if (data.selectedProductId) setSelectedProductId(data.selectedProductId);
        setVisitors(data.visitors || []);
        setTotalViews(data.totalViews || 0);
        setUniqueViews(data.uniqueViewersCount || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchViews();
  }, []);

  if (!loading && products.length === 0) {
    return null; // Seller has no published products yet
  }

  return (
    <div className="clean-card p-6 bg-[#111D38] border border-[#1E3A5F] rounded-3xl space-y-6 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              من شاهد منتجي؟ (Product Viewers Intelligence)
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800 font-semibold">
                رصد دقيق
              </span>
            </h3>
            <p className="text-xs text-stone-400">
              قائمة الطلاب والزوار المسجلين الذين تصفحوا كتبك وملخصاتك
            </p>
          </div>
        </div>

        {/* Product Selector */}
        {products.length > 1 && (
          <div className="relative">
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                fetchViews(e.target.value);
              }}
              className="px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white appearance-none pr-8 cursor-pointer focus:border-teal-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-stone-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 text-right">
          <span className="text-[11px] text-stone-400 block">إجمالي المشاهدات</span>
          <span className="text-xl font-black text-white">{totalViews}</span>
        </div>
        <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 text-right">
          <span className="text-[11px] text-stone-400 block">مشاهدون فريدون</span>
          <span className="text-xl font-black text-teal-400">{uniqueViews}</span>
        </div>
        <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 text-right col-span-2 sm:col-span-1">
          <span className="text-[11px] text-stone-400 block">الزوار المتفاعلون</span>
          <span className="text-xl font-black text-amber-400">{visitors.length}</span>
        </div>
      </div>

      {/* Visitors List */}
      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 bg-slate-900/50 rounded-xl" />
          ))}
        </div>
      ) : visitors.length > 0 ? (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {visitors.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-teal-500/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <AvatarFallback
                  src={v.visitorAvatar}
                  name={v.visitorName}
                  size={36}
                  className="w-9 h-9 rounded-full object-cover border border-teal-500/30"
                />
                <div>
                  <span className="text-xs font-bold text-white block">
                    {v.visitorName}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-stone-300 font-semibold uppercase">
                    {v.visitorRole}
                  </span>
                </div>
              </div>

              <span className="text-[11px] text-stone-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-teal-400" />
                {v.relativeTimeStr}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl space-y-1">
          <Sparkles className="w-6 h-6 text-teal-400/40 mx-auto" />
          <p className="text-xs text-stone-300 font-semibold">لا توجد مشاهدات مسجلة بعد لهذا المورد</p>
          <p className="text-[11px] text-stone-400">ستظهر هنا تفاصيل وهوية كل من يتصفح هذا الكتاب أو الملخص.</p>
        </div>
      )}
    </div>
  );
};
