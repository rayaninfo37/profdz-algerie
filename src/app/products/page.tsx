import React from 'react';
import { prisma } from '@/lib/db';
import { ProductCard } from '@/components/discovery/ProductCard';
import { enrichProducts, isPublicProduct } from '@/lib/products';
import { rankProducts } from '@/lib/productRanking';
import { BookOpen } from 'lucide-react';

// Dynamic real-time products catalog
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProductsCatalogPage() {
  const where: any = { isPublished: true };

  const rawProducts = await prisma.product.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 60,
    select: {
      id: true,
      creatorId: true,
      creatorName: true,
      creatorType: true,
      title: true,
      slug: true,
      description: true,
      coverImage: true,
      productType: true,
      subject: true,
      educationLevel: true,
      priceDZD: true,
      isFree: true,
      previewContent: true,
      isPublished: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const allEnriched = await enrichProducts(rawProducts);
  const eligibleProducts = allEnriched.filter(isPublicProduct);
  const ranked = rankProducts(eligibleProducts);
  const products = ranked.map((r) => r.product);

  return (
    <div className="max-w-7xl mx-auto space-y-10 text-white" dir="rtl">
      {/* Editorial Header Banner with Academic Atmosphere - Crystal Clear */}
      <div className="relative rounded-3xl min-h-[220px] flex items-center border border-sky-400/40 p-8 sm:p-10 overflow-hidden shadow-2xl text-white bg-slate-950">
        <div className="absolute inset-0 z-0">
          <img
            src="/media/education/academic_library.jpg"
            alt="المكتبة التعليمية الرقمية"
            className="w-full h-full object-cover object-center filter brightness-[0.88] contrast-[1.08]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#06101D]/80 via-[#0A1B33]/50 to-transparent" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 w-full">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 text-xs font-bold uppercase tracking-wider shadow-sm">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>المتجر الرقمي الوطني • ملخصات وكتب 🇩🇿</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              المتجر والمكتبة التعليمية
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
              كتب رقمية، ملخصات دراسية، وحقائب البكالوريا وBEM بإشراف نخبة الأساتذة والمدرسين مع إمكانية التصفح والمعاينة المجانية.
            </p>
          </div>

          <div className="p-4 bg-slate-950/80 border border-sky-400/30 rounded-2xl text-xs flex flex-col gap-1 shadow-xl shrink-0">
            <span className="text-slate-400 text-[11px]">الموارد والملخصات المتاحة:</span>
            <strong className="text-sky-300 font-mono text-xl font-black">{products.length} مؤلّف وملخص</strong>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
              <span>●</span> متاح للمعاينة والتواصل المباشر
            </span>
          </div>
        </div>
      </div>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product as any} />
          ))}
        </div>
      ) : (
        <div className="p-16 text-center clean-card text-slate-400 text-sm bg-slate-900/60 border border-slate-800 shadow-xl rounded-2xl">
          لا توجد منتجات رقمية منشورة حالياً في المتجر.
        </div>
      )}
    </div>
  );
}