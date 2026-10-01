import React from 'react';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { recordProfileView, getProfileViewCount } from '@/lib/profileViews';
import { recordProfileView as recordReachView } from '@/lib/reach';
import { getCurrentUser } from '@/lib/auth';
import { MapPin, Star, Award, Lock, BookOpen, Newspaper } from 'lucide-react';
import { Badge, RoleBadge } from '@/components/ui/Badge';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { ProductCard } from '@/components/discovery/ProductCard';
import { PostCard } from '@/components/feed/PostCard';
import { ProtectedContactButtons } from '@/components/discovery/ProtectedContactButtons';
import { TeacherReviewSection } from '@/components/discovery/TeacherReviewSection';
import AvatarFallback from '@/components/common/AvatarFallback';
import { enrichProducts, isPublicProduct } from '@/lib/products';
import { isPubliclyDiscoverable, findTeacherByIdOrSlug } from '@/lib/teacherVisibility';

export const revalidate = 0;

export default async function TeacherProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, currentUser] = await Promise.all([
    params,
    getCurrentUser(),
  ]);

  const teacher = await findTeacherByIdOrSlug(id, {
    user: true,
    _count: { select: { reviews: true, reachEvents: true } },
  });

  if (!teacher) {
    notFound();
  }

  const isAdmin = currentUser?.role === 'ADMIN';
  const isOwner = currentUser?.id === teacher.userId;

  if (!isPubliclyDiscoverable(teacher) && !isAdmin && !isOwner) {
    notFound();
  }

  let ipHash: string | undefined = undefined;
  if (!currentUser) {
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '127.0.0.1';
    const clientIp = forwardedFor.split(',')[0].trim();
    ipHash = crypto.createHash('sha256').update(clientIp).digest('hex');
  }

  const isFrozen = teacher.subscriptionState === 'FROZEN';

  // Parallelize analytics tracking alongside page queries to eliminate waterfall
  const [rawProducts, posts, reviews, viewsCount, contactsCount] = await Promise.all([
    prisma.product.findMany({
      where: { creatorId: teacher.id, isPublished: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.post.findMany({
      where: { authorId: teacher.userId },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            role: true,
            teacherProfile: true,
          },
        },
        likes: true,
        comments: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.review.findMany({
      where: { targetId: teacher.id, status: 'PUBLISHED' },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            wilaya: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    getProfileViewCount(teacher.id, 'TEACHER'),
    prisma.contactEvent.count({ where: { targetId: teacher.id } }),
    recordProfileView(teacher.id, 'TEACHER', currentUser?.id, ipHash),
    currentUser ? recordReachView(teacher.id, currentUser.id) : Promise.resolve(),
  ]);

  const allEnrichedProducts = await enrichProducts(rawProducts);
  const products = allEnrichedProducts.filter(isPublicProduct);

  const totalReviews = reviews.length;
  const rawAvg = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0;
  const averageRating = rawAvg > 0 ? (Math.round(rawAvg * 10) / 10).toFixed(1) : null;

  const subjectsList: string[] = typeof teacher.subjects === 'string'
    ? JSON.parse(teacher.subjects || '[]')
    : teacher.subjects || [];
  const levelsList: string[] = typeof teacher.educationLevels === 'string'
    ? JSON.parse(teacher.educationLevels || '[]')
    : teacher.educationLevels || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-white" dir="rtl">
      {/* Frozen Alert Banner if Trial Expired */}
      {isFrozen && (
        <div className="p-4 bg-rose-950/80 border border-rose-500/50 rounded-2xl flex items-center justify-between text-rose-200 shadow-xl">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-rose-400" />
            <div className="text-xs">
              <strong className="block text-sm font-bold text-white">انتهت الفترة التجريبية المجانية (30 يوماً)</strong>
              حساب الأستاذ في حالة تجميد مؤقت للظهور المجاني. البيانات والمراجعات محفوظة بالكامل.
            </div>
          </div>
        </div>
      )}

      {/* Header Profile Section: Luminous Azure Card */}
      <div className="clean-card p-6 sm:p-10 space-y-8 bg-[#092235]/90 border border-sky-400/35 rounded-3xl shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative shrink-0">
              <AvatarFallback
                src={teacher.user.avatarUrl}
                name={teacher.user.fullName}
                size={112}
                className="w-28 h-28 border-2 border-sky-400 shadow-xl shadow-sky-500/25"
              />
              {teacher.isVerified && (
                <div className="absolute -bottom-2 -right-2 shadow-md" title="Verified Teacher">
                  <VerifiedBadge size="lg" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">{teacher.user.fullName}</h1>
                <RoleBadge
                  role="TEACHER"
                  professionalTitle={teacher.professionalTitle}
                  size="md"
                />
                {teacher.isVerified && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-sky-500/20 border border-sky-400/40 text-sky-200">
                    أستاذ معتمد وموثق
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-sky-300">{teacher.headline || 'أستاذ تعليمي معتمد'}</p>

              <div className="flex items-center gap-4 text-xs text-slate-300 pt-1 flex-wrap font-medium">
                {teacher.user.wilaya && (
                  <span className="flex items-center gap-1.5 text-slate-200">
                    <MapPin className="w-4 h-4 text-sky-400" /> {teacher.user.wilaya}
                  </span>
                )}
                {teacher.storeLocation && (
                  <span className="flex items-center gap-1.5 text-cyan-300">
                    <MapPin className="w-4 h-4 text-teal-400" /> مقر التدريس: {teacher.storeLocation}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                  <Star className={`w-4 h-4 ${totalReviews > 0 ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                  {totalReviews > 0 ? `${averageRating} ★ (${totalReviews} تقييم)` : 'جديد (0 تقييم)'}
                </span>
                <span className="flex items-center gap-1.5 text-slate-200">
                  <Award className="w-4 h-4 text-teal-400" /> {teacher.experienceYears} سنوات خبرة
                </span>
              </div>
            </div>
          </div>

          {/* Contact Action */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <ProtectedContactButtons
              targetId={teacher.id}
              targetType="TEACHER"
              phone={teacher.phone}
              whatsapp={teacher.whatsapp}
              telegram={teacher.telegram}
              teacherName={teacher.user.fullName}
              isAuthenticated={!!currentUser}
            />
          </div>
        </div>

        {/* Real Transparent Metrics Banner (Visits, Reviews, Products, Posts) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-white/10">
          <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-white/10 text-center space-y-1 shadow-inner">
            <span className="text-[11px] text-slate-400 block font-medium">زيارات الملف</span>
            <span className="text-base font-black text-sky-400">{viewsCount}</span>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-white/10 text-center space-y-1 shadow-inner">
            <span className="text-[11px] text-slate-400 block font-medium">التقييمات المعتمدة</span>
            <span className="text-base font-black text-amber-400">{totalReviews}</span>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-white/10 text-center space-y-1 shadow-inner">
            <span className="text-[11px] text-slate-400 block font-medium">المنتجات والموارد</span>
            <span className="text-base font-black text-teal-400">{products.length}</span>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-white/10 text-center space-y-1 shadow-inner">
            <span className="text-[11px] text-slate-400 block font-medium">المنشورات والإعلانات</span>
            <span className="text-base font-black text-white">{posts.length}</span>
          </div>
        </div>

        {/* Subjects & Levels Tags */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
          <span className="text-xs font-bold text-slate-300">المواد والمستويات التعليمية:</span>
          {subjectsList.map((s, i) => (
            <span key={i} className="text-xs font-bold px-3 py-1 rounded-lg bg-sky-950/60 border border-sky-400/30 text-sky-200">
              {s}
            </span>
          ))}
          {levelsList.map((l, i) => (
            <span key={i} className="text-xs font-medium px-3 py-1 rounded-lg bg-slate-900 border border-white/10 text-slate-300">
              {l}
            </span>
          ))}
        </div>
      </div>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Bio & Info */}
        <div className="space-y-6">
          <div className="clean-card p-6 sm:p-7 space-y-5 bg-[#092235]/90 border border-sky-400/30 rounded-2xl shadow-xl backdrop-blur-xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-teal-400" /> نبذة عن الأستاذ والخلفية التعليمية
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-normal">
              {teacher.bio || 'لا توجد نبذة تعريفية حالياً.'}
            </p>

            {teacher.qualifications && (() => {
              let quals: string[] = [];
              try {
                if (teacher.qualifications.startsWith('[')) {
                  quals = JSON.parse(teacher.qualifications);
                }
              } catch {}
              if (!Array.isArray(quals) || quals.length === 0) {
                quals = teacher.qualifications.split(/[\n,]/).map((q: string) => q.trim()).filter(Boolean);
              }

              return (
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <span className="text-[11px] font-bold text-sky-300 uppercase block tracking-wider">المؤهلات العلمية والشهادات:</span>
                  {quals.length > 1 ? (
                    <div className="space-y-2">
                      {quals.map((q, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200">
                          <span className="text-sky-400 font-bold">•</span>
                          <span>{q}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300">{teacher.qualifications}</p>
                  )}
                </div>
              );
            })()}

            {(teacher.priceMin !== null || teacher.priceMax !== null || teacher.pricingInfo) && (
              <div className="pt-4 border-t border-white/10 space-y-2">
                <span className="text-[11px] font-bold text-sky-300 uppercase tracking-wider block">تسعيرة الدروس:</span>
                {(teacher.priceMin !== null || teacher.priceMax !== null) && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-950/70 border border-sky-400/40 text-sky-200 font-bold text-xs">
                    {teacher.priceMin !== null && teacher.priceMax !== null ? (
                      teacher.priceMin === teacher.priceMax ? (
                        <span>{teacher.priceMin.toLocaleString()} دج / حصة</span>
                      ) : (
                        <span>من {teacher.priceMin.toLocaleString()} إلى {teacher.priceMax.toLocaleString()} دج / حصة</span>
                      )
                    ) : teacher.priceMin !== null ? (
                      <span>من {teacher.priceMin?.toLocaleString()} دج</span>
                    ) : (
                      <span>حتى {teacher.priceMax?.toLocaleString()} دج</span>
                    )}
                  </div>
                )}
                {teacher.pricingInfo && (
                  <p className="text-xs text-slate-300 pt-0.5">{teacher.pricingInfo}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Products, Feed Posts & Reviews */}
        <div className="lg:col-span-2 space-y-8">
          {/* Creator Digital Products */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-sky-400" /> كتب وموارد رقمية يقدمها الأستاذ ({products.length})
            </h3>
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p as any} />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center clean-card text-slate-400 text-xs bg-[#092235]/60 border border-white/10 rounded-2xl shadow-md">
                لم يقم الأستاذ بإضافة منتجات رقمية بعد.
              </div>
            )}
          </div>

          {/* Educational Feed Posts */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Newspaper className="w-5 h-5 text-teal-400" /> منشورات وإرشادات الأستاذ ({posts.length})
            </h3>
            {posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post as any} currentUserId={currentUser?.id} />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center clean-card text-slate-400 text-xs bg-[#092235]/60 border border-white/10 rounded-2xl shadow-md">
                لا توجد منشورات تعليمية منشورة بعد.
              </div>
            )}
          </div>

          {/* Student Reviews Showcase with Live Submission */}
          <TeacherReviewSection
            teacherProfileId={teacher.id}
            teacherUserId={teacher.userId}
            currentUserId={currentUser?.id}
            initialReviews={reviews as any}
          />
        </div>
      </div>
    </div>
  );
}