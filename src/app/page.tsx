import React, { Suspense } from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { TeacherCard } from '@/components/discovery/TeacherCard';
import { ProductCard } from '@/components/discovery/ProductCard';
import { SearchBar } from '@/components/discovery/SearchBar';
import { Button } from '@/components/ui/Button';
import { getTopRankedTeachersCached } from '@/lib/ranking';
import { enrichProducts, isPublicProduct } from '@/lib/products';
import { rankProducts } from '@/lib/productRanking';
import {
  Users,
  BookOpen,
  Sparkles,
  ArrowRight,
  Compass,
} from 'lucide-react';

export const revalidate = 0;

export default async function HomePage() {
  const currentUser = await getCurrentUser();

  // 1. Fetch top 12 teachers with central Bayesian ranking (same data as /teachers)
  const rankedTeachers = await getTopRankedTeachersCached(12);
  const teachers = rankedTeachers.map(r => r.teacher);

  // 2. Fetch top 6 real products using shared Bayesian ranking and public eligibility
  const rawProducts = await prisma.product.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
  });
  const enrichedProducts = await enrichProducts(rawProducts);
  const eligibleProducts = enrichedProducts.filter(isPublicProduct);
  const rankedProducts = rankProducts(eligibleProducts);
  const products = rankedProducts.slice(0, 6).map(r => r.product);

  return (
    <div className="space-y-16 pb-24 text-white">
      {/* 1. HERO SECTION: Illuminated Algiers Panorama & Spotlight Showcase */}
      <section className="relative overflow-hidden pt-4 pb-16 px-4 sm:px-6 lg:px-8 border-b border-cyan-500/20">
        {/* Ambient Subtle Glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 right-1/4 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-3xl" />
          <div className="absolute top-40 left-10 w-[400px] h-[400px] bg-teal-600/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto space-y-6 relative z-10">
          {/* Hero Billboard: Clear, Brilliant Monumental Background without heavy dark veil or blue tint */}
          <div className="relative rounded-3xl overflow-hidden border border-white/20 shadow-2xl min-h-[440px] flex items-end">
            {/* Real Monumental Maqam Echahid & Bay of Algiers Background - Clean, Sharp & Vivid */}
            <div className="absolute inset-0 z-0">
              <img
                src="/media/hero/maqam_echahid_algiers.jpg"
                alt="Maqam Echahid Algiers - مقام الشهيد"
                className="w-full h-full object-cover object-center"
              />
              {/* Local contrast gradient strictly behind text block on the left/bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-transparent to-transparent" />
            </div>

            {/* Floating Slogan at Top Left */}
            <div className="absolute top-8 left-8 z-10 hidden md:block text-left">
              <div className="text-2xl lg:text-3xl font-serif font-black text-white drop-shadow-md tracking-tight">
                من الجزائر...
              </div>
              <div className="text-3xl lg:text-4xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-white drop-shadow-lg">
                إلى العالم
              </div>
              <span className="text-[10px] text-cyan-200 tracking-widest uppercase font-mono mt-1 block font-bold">
                Algerian Education Ecosystem
              </span>
            </div>

            {/* Foreground Content */}
            <div className="relative z-10 p-6 sm:p-10 lg:p-12 max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/80 border border-white/20 text-cyan-300 text-xs font-bold uppercase tracking-wider shadow-md">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>المنصة الرسمية • PROF DZ</span>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight drop-shadow-lg">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-300 to-white">PROF DZ</span>
                </h1>
                <p className="text-base sm:text-lg text-white leading-relaxed font-medium drop-shadow-md">
                  المنظومة التعليمية الرقمية الموثوقة لربط التلاميذ والأولياء بنخبة الأساتذة والمصادر التعليمية عبر 58 ولاية جزائرية.
                </p>
              </div>

              {/* Educational Trust Tags */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-bold px-3 py-1 rounded-lg bg-slate-900/90 border border-white/20 text-cyan-300 shadow-sm">
                  منظومة تعليمية وطنية رائدة
                </span>
                <span className="text-[11px] font-bold px-3 py-1 rounded-lg bg-slate-900/90 border border-white/20 text-teal-300 shadow-sm">
                  BAC & BEM 2026
                </span>
                <span className="text-[11px] font-bold px-3 py-1 rounded-lg bg-slate-900/90 border border-white/20 text-emerald-300 shadow-sm">
                  تواصل مباشر (واتساب / هاتف)
                </span>
              </div>

              {/* CTA Button */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link href="/teachers">
                  <Button variant="primary" size="lg" className="h-12 px-7 gap-2.5 bg-gradient-to-r from-teal-500 via-cyan-500 to-sky-500 hover:from-teal-400 hover:to-cyan-400 text-white font-black rounded-2xl shadow-lg shadow-cyan-500/35 transition-all transform hover:-translate-y-1">
                    <Compass className="w-5 h-5" /> استكشف الأساتذة
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FACETED DISCOVERY & SEARCH ENGINE BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <Suspense fallback={<div className="p-6 clean-card text-center text-cyan-400 text-xs">جاري تحميل محرك البحث...</div>}>
          <div className="shadow-2xl rounded-2xl overflow-hidden border border-cyan-500/20">
            <SearchBar targetPath="/teachers" />
          </div>
        </Suspense>
      </section>

      {/* 3. ACTIVE TEACHER FACULTY GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-700/50 text-cyan-400 shadow-xs">
                <Users className="w-6 h-6" />
              </span>
              <span>نخبة الأساتذة في الجزائر</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-normal">
              تصفح ملفات الأساتذة وتواصل معهم مباشرة لمرافقة أبنائكم أكاديمياً عبر كافة الأطوار
            </p>
          </div>

          <Link href="/teachers">
            <Button variant="outline" size="sm" className="gap-2 font-bold border-slate-700 text-cyan-300 hover:bg-slate-800 rounded-xl px-4 py-2 shadow-xs">
              عرض جميع الأساتذة <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {teachers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teachers.map((teacher) => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher as any}
                isAuthenticated={!!currentUser}
                hideContact={true}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center clean-card text-slate-400 text-sm bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xs">
            لا يوجد أساتذة متاحون حالياً.
          </div>
        )}
      </section>

      {/* 4. EDUCATIONAL RESOURCES & PUBLICATIONS */}
      {products.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
                <BookOpen className="w-7 h-7 text-cyan-400" /> المتجر والموارد التعليمية
              </h2>
              <p className="text-xs text-slate-400">كتب وملخصات وسلاسل موثوقة يقدمها نخبة الأساتذة والمدرسين</p>
            </div>

            <Link href="/products">
              <Button variant="outline" size="sm" className="gap-2 font-bold border-slate-700 text-slate-300 hover:bg-slate-800 shadow-xs">
                تصفح جميع المنتجات <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p as any} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

