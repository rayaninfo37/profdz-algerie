import React, { Suspense } from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { TeacherCard } from '@/components/discovery/TeacherCard';
import { SearchBar } from '@/components/discovery/SearchBar';
import { Users, ChevronRight, ChevronLeft, Filter } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { expandSubjectKeywords, expandLevelKeywords } from '@/lib/taxonomy';
import { calculateBayesianScore } from '@/lib/ranking';

// Dynamic real-time teachers directory
export const revalidate = 0;

interface TeachersPageProps {
  searchParams: Promise<{
    q?: string;
    wilaya?: string;
    subject?: string;
    level?: string;
    mode?: string;
    page?: string;
    pageSize?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}

export default async function TeachersDirectoryPage({ searchParams }: TeachersPageProps) {
  const params = await searchParams;

  // Pagination parameters
  const page = Math.max(1, parseInt(params.page || '1', 10));
  const rawPageSize = parseInt(params.pageSize || '30', 10);
  const allowedPageSizes = [10, 30, 50, 100];
  const pageSize = allowedPageSizes.includes(rawPageSize) ? rawPageSize : 30;

  // Search & Faceted filters
  const q = params.q?.trim() || '';
  const wilaya = params.wilaya?.trim() || '';
  const subject = params.subject?.trim() || '';
  const level = params.level?.trim() || '';
  const mode = params.mode?.trim() || '';
  const minPriceNum = params.minPrice ? parseInt(params.minPrice, 10) : null;
  const maxPriceNum = params.maxPrice ? parseInt(params.maxPrice, 10) : null;

  // Build clean orthogonal AND conditions
  const andConditions: any[] = [];

  // 1. Subscription eligibility: strictly active profiles (FREE_ACTIVE or PRO_ACTIVE)
  andConditions.push({
    subscriptionState: { in: ['FREE_ACTIVE', 'PRO_ACTIVE'] },
  });

  // 2. Free-text search (q)
  if (q) {
    andConditions.push({
      OR: [
        { user: { fullName: { contains: q } } },
        { headline: { contains: q } },
        { bio: { contains: q } },
        { subjects: { contains: q } },
      ],
    });
  }

  // 3. Wilaya filter
  if (wilaya) {
    andConditions.push({
      user: {
        wilaya: { contains: wilaya },
      },
    });
  }

  // 4. Canonical Subject filter with alias expansion
  if (subject) {
    const subjectKeywords = expandSubjectKeywords(subject);
    if (subjectKeywords.length > 0) {
      andConditions.push({
        OR: subjectKeywords.map((kw) => ({ subjects: { contains: kw } })),
      });
    }
  }

  // 5. Canonical Level filter with alias expansion
  if (level) {
    const levelKeywords = expandLevelKeywords(level);
    if (levelKeywords.length > 0) {
      andConditions.push({
        OR: levelKeywords.map((kw) => ({ educationLevels: { contains: kw } })),
      });
    }
  }

  // 6. Teaching mode filter
  if (mode && ['IN_PERSON', 'ONLINE', 'BOTH'].includes(mode)) {
    andConditions.push({
      teachingMode: { in: [mode, 'BOTH'] },
    });
  }

  // 7. Structured Price range filters (minPrice / maxPrice)
  if (minPriceNum !== null && !isNaN(minPriceNum)) {
    andConditions.push({
      OR: [
        { priceMax: { gte: minPriceNum } },
        { priceMin: { gte: minPriceNum } },
      ],
    });
  }

  if (maxPriceNum !== null && !isNaN(maxPriceNum)) {
    andConditions.push({
      OR: [
        { priceMin: { lte: maxPriceNum } },
        { priceMax: { lte: maxPriceNum } },
      ],
    });
  }

  const whereClause = {
    AND: [
      ...andConditions,
      // Never show frozen or soft-deleted teachers in discovery
      { user: { isFrozen: false, softDeletedAt: null } },
    ],
  };

  const hasFilters = Boolean(q || wilaya || subject || level || mode || minPriceNum !== null || maxPriceNum !== null);

  let scoredTeachers: any[] = [];
  let totalCount = 0;

  if (!hasFilters) {
    const { getAllRankedTeachersCached } = await import('@/lib/ranking');
    const allRanked = await getAllRankedTeachersCached();
    totalCount = allRanked.length;
    scoredTeachers = allRanked.map((r: any) => ({
      ...(r.teacher || r),
      bayesianScore: r.bayesianScore ?? 0,
    }));
  } else {
    // Direct SQL Matching with minimal select fields
    const allMatchingTeachers = await prisma.teacherProfile.findMany({
      where: whereClause,
      select: {
        id: true,
        userId: true,
        headline: true,
        bio: true,
        subjects: true,
        educationLevels: true,
        teachingMode: true,
        experienceYears: true,
        isVerified: true,
        professionalTitle: true,
        subscriptionState: true,
        ratingAverage: true,
        reviewCount: true,
        priceMin: true,
        priceMax: true,
        phone: true,
        whatsapp: true,
        telegram: true,
        facebook: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            wilaya: true,
          },
        },
        _count: { select: { reviews: true, reachEvents: true } },
      },
    });

    totalCount = allMatchingTeachers.length;

    // Rank teachers by Bayesian Weighted Score WR = (v / (v + m)) * R + (m / (v + m)) * C (m=5, C=3.0)
    scoredTeachers = allMatchingTeachers.map((t) => {
      const rawRating = t.ratingAverage || 0;
      const reviewCount = t.reviewCount || 0;
      const bayesianScore = calculateBayesianScore(rawRating, reviewCount, 5, 3.0);
      return {
        ...t,
        bayesianScore,
      };
    });

    scoredTeachers.sort((a, b) => {
      if (b.bayesianScore !== a.bayesianScore) {
        return b.bayesianScore - a.bayesianScore;
      }
      if (b.reviewCount !== a.reviewCount) {
        return b.reviewCount - a.reviewCount;
      }
      if (a.isVerified !== b.isVerified) {
        return a.isVerified ? -1 : 1;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }

  const teachers = scoredTeachers.slice((page - 1) * pageSize, page * pageSize);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Helper to build pagination link with retained query params
  const buildPageUrl = (targetPage: number, targetPageSize: number = pageSize) => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (wilaya) p.set('wilaya', wilaya);
    if (subject) p.set('subject', subject);
    if (level) p.set('level', level);
    if (mode) p.set('mode', mode);
    if (params.minPrice) p.set('minPrice', params.minPrice);
    if (params.maxPrice) p.set('maxPrice', params.maxPrice);
    p.set('page', targetPage.toString());
    p.set('pageSize', targetPageSize.toString());
    return `/teachers?${p.toString()}`;
  };

  const startResult = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endResult = Math.min(page * pageSize, totalCount);

  return (
    <div className="max-w-7xl mx-auto space-y-10 text-white" dir="rtl">
      {/* Directory Header Banner */}
      <div className="relative rounded-3xl min-h-[220px] flex items-center border border-sky-400/40 p-8 sm:p-10 overflow-hidden shadow-2xl text-white bg-slate-950">
        <div className="absolute inset-0 z-0">
          <img
            src="/media/algiers/algiers_panoramic.jpg"
            alt="دليل الأساتذة في الجزائر"
            className="w-full h-full object-cover object-center filter brightness-[0.90] contrast-[1.08]"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-[#06101D]/85 via-[#0A1B33]/55 to-transparent" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 w-full">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 text-xs font-bold uppercase tracking-wider shadow-sm">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>نخبة الأساتذة • 58 ولاية 🇩🇿</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              دليل الأساتذة في الجزائر
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
              اكتشف وتواصل مباشرة مع نخبة الأساتذة عبر كافة ولايات الوطن لمرافقة أبنائكم أكاديمياً (دروس حضورية وعن بعد).
            </p>
          </div>

          <div className="p-4 bg-slate-950/80 border border-sky-400/30 rounded-2xl text-xs flex flex-col gap-1 shadow-xl shrink-0">
            <span className="text-slate-400 text-[11px]">إجمالي الأساتذة:</span>
            <strong className="text-sky-300 font-mono text-xl font-black">{totalCount} أستاذ</strong>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
              <span>●</span> جاهزون للتواصل المباشر
            </span>
          </div>
        </div>
      </div>

      {/* Faceted Search Bar */}
      <Suspense fallback={<div className="p-6 clean-card bg-slate-900 text-center text-cyan-400 text-xs">جاري تحميل أدوات الفلترة...</div>}>
        <SearchBar
          targetPath="/teachers"
          initialFilters={{ q, wilaya, subject, level, mode, minPrice: params.minPrice, maxPrice: params.maxPrice }}
        />
      </Suspense>

      {/* Pagination Summary & PageSize Selector Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-300 bg-[#0A1A2E]/90 p-4 rounded-2xl border border-sky-400/25 shadow-lg backdrop-blur-md">
        <div>
          عرض <strong className="text-white">{startResult} - {endResult}</strong> من أصل <strong className="text-sky-300 font-bold">{totalCount}</strong> أستاذ (الصفحة {page} من {totalPages})
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">عرض في الصفحة:</span>
          {allowedPageSizes.map((size) => (
            <Link
              key={size}
              href={buildPageUrl(1, size)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-colors ${
                pageSize === size
                  ? 'bg-gradient-to-r from-teal-600 to-cyan-600 border-cyan-400 text-white shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/80 border-white/10 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {size}
            </Link>
          ))}
        </div>
      </div>

      {/* Teachers Grid (3 Columns) */}
      {teachers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map((t) => (
            <TeacherCard
              key={t.id}
              teacher={t as any}
              hideContact={true}
            />
          ))}
        </div>
      ) : (
        <div className="p-16 text-center rounded-3xl space-y-4 bg-[#0A1628]/90 border border-cyan-500/30 text-slate-100 shadow-xl backdrop-blur-xl">
          <Filter className="w-12 h-12 text-cyan-400/80 mx-auto" />
          <h3 className="text-lg font-bold text-white">لم يتم العثور على نتائج تطابق خيارات البحث</h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            جرب تغيير الولاية، المادة الدراسية، أو تخفيف قيود الأسعار لعرض المزيد من الأساتذة.
          </p>
          <div className="pt-2">
            <Link href="/teachers">
              <Button variant="primary" size="sm" className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold">
                إعادة ضبط البحث وعرض الجميع
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Bottom Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6 border-t border-white/10">
          {page > 1 ? (
            <Link href={buildPageUrl(page - 1)}>
              <Button variant="outline" size="sm" className="gap-1 border-white/10 bg-slate-900/80 text-slate-200 hover:bg-slate-800 hover:text-white">
                <ChevronRight className="w-4 h-4" /> السابق
              </Button>
            </Link>
          ) : (
            <Button variant="outline" size="sm" disabled className="gap-1 border-white/5 bg-slate-950/40 text-slate-600 cursor-not-allowed">
              <ChevronRight className="w-4 h-4" /> السابق
            </Button>
          )}

          {/* Page Numbers */}
          <div className="flex items-center gap-1.5 px-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5 && page > 3) {
                pageNum = page - 2 + i;
                if (pageNum > totalPages) pageNum = totalPages - 4 + i;
              }
              const isCurrent = pageNum === page;
              return (
                <Link
                  key={pageNum}
                  href={buildPageUrl(pageNum)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-colors ${
                    isCurrent
                      ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-cyan-500/30 border border-cyan-400'
                      : 'bg-slate-900/80 border border-white/10 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {pageNum}
                </Link>
              );
            })}
          </div>

          {page < totalPages ? (
            <Link href={buildPageUrl(page + 1)}>
              <Button variant="outline" size="sm" className="gap-1 border-white/10 bg-slate-900/80 text-slate-200 hover:bg-slate-800 hover:text-white">
                التالي <ChevronLeft className="w-4 h-4" />
              </Button>
            </Link>
          ) : (
            <Button variant="outline" size="sm" disabled className="gap-1 border-white/5 bg-slate-950/40 text-slate-600 cursor-not-allowed">
              التالي <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
