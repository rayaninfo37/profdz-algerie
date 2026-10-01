import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getTeacherReachStatus } from '@/lib/reach';
import { prisma } from '@/lib/db';
import { UserRole } from '@/types';
import { ReachGauge } from '@/components/dashboard/ReachGauge';
import { Eye, Users, Star, BookOpen, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import AvatarFallback from '@/components/common/AvatarFallback';
import { TeacherDashboardClient } from '@/components/dashboard/TeacherDashboardClient';
import { ProfileCompletenessCard } from '@/components/dashboard/ProfileCompletenessCard';
import { TeacherCountdown } from '@/components/dashboard/TeacherCountdown';
import { ProfileVisitorsCard } from '@/components/dashboard/ProfileVisitorsCard';
import { ProductVisitorsAnalytics } from '@/components/dashboard/ProductVisitorsAnalytics';
import { OrdersManager } from '@/components/dashboard/OrdersManager';

export const revalidate = 0;

export default async function TeacherDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.TEACHER || !user.teacherProfile) {
    redirect('/login');
  }

  const teacher = user.teacherProfile;

  // Compute 30-day window in Africa/Algiers timezone
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Parallelize all dashboard queries in a single wave to minimize round trips
  const [
    reachStatus,
    activeSubscription,
    contactRequests,
    profileViews30d,
    uniqueReach30d,
    productInquiriesCount,
    postsCount,
    postLikes30d,
    postComments30d,
    contactClicks30d,
    productsCount,
    reviewsCount,
  ] = await Promise.all([
    getTeacherReachStatus(teacher.id),
    prisma.subscription.findFirst({
      where: { teacherId: teacher.id, status: 'ACTIVE' },
      orderBy: { expiresAt: 'desc' },
    }),
    prisma.productContactRequest.findMany({
      where: { teacherId: teacher.id },
      include: {
        product: { select: { title: true, slug: true } },
        user: { select: { fullName: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    // 1. زيارات الملف — آخر 30 يومًا
    prisma.profileView.count({
      where: {
        targetId: teacher.id,
        targetType: 'TEACHER',
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    // 2. الزوار الفريدون — آخر 30 يومًا
    prisma.reachEvent.count({
      where: {
        teacherId: teacher.id,
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    // 3. طلبات التواصل المباشر مع الموارد
    prisma.productContactRequest.count({ where: { teacherId: teacher.id } }),
    // 4. المنشورات التعليمية
    prisma.post.count({ where: { authorId: user.id } }),
    // 5 & 6. تفاعل المنشورات (إعجابات وتعليقات آخر 30 يومًا)
    prisma.postLike.count({
      where: {
        post: { authorId: user.id },
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.comment.count({
      where: {
        post: { authorId: user.id },
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    // 7. نقرات التواصل — آخر 30 يومًا
    prisma.contactEvent.count({
      where: {
        targetId: teacher.id,
        targetType: 'TEACHER',
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    // 8. موارد المتجر المنشورة
    prisma.product.count({ where: { creatorId: teacher.id, isPublished: true } }),
    // 9. التقييمات والمراجعات
    prisma.review.count({ where: { targetId: teacher.id, status: 'PUBLISHED' } }),
  ]);

  const postInteractions30d = postLikes30d + postComments30d;

  // Calculate Profile Completeness Score
  let score = 0;
  const missingFields: string[] = [];

  if (user.avatarUrl) score += 15; else missingFields.push('صورة الملف الشخصي (Avatar)');
  if (teacher.headline && teacher.bio) score += 20; else missingFields.push('العنوان العريض والنبذة التعريفية');
  if (teacher.experienceYears > 0 || teacher.qualifications) score += 20; else missingFields.push('سنوات الخبرة والمؤهلات العلمية');
  if (teacher.subjects && teacher.subjects !== '[]') score += 25; else missingFields.push('المواد الدراسية والمستويات');
  if (teacher.phone || teacher.whatsapp) score += 20; else missingFields.push('معلومات الاتصال (الهاتف أو WhatsApp)');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-100" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0A1628]/80 border border-cyan-500/20 p-6 shadow-xl rounded-3xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <AvatarFallback
            src={user.avatarUrl}
            name={user.fullName}
            size={64}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-500 shadow-sm"
          />
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              مرحباً بك، {user.fullName}
              {teacher.isVerified && (
                <VerifiedBadge size="sm" showLabel={true} />
              )}
            </h1>
            <p className="text-xs text-teal-700 font-semibold">{teacher.headline || 'لوحة تحكم الأستاذ'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <TeacherCountdown
            expiresAt={activeSubscription?.expiresAt ? activeSubscription.expiresAt.toISOString() : null}
            subscriptionState={teacher.subscriptionState}
          />
          <Badge variant={teacher.subscriptionState === 'PRO_ACTIVE' ? 'amber' : 'teal'} size="md">
            {teacher.subscriptionState === 'PRO_ACTIVE' ? 'PRO مُميّز' : 'حساب عادي'}
          </Badge>
        </div>
      </div>

      {/* Profile Completeness Card */}
      <ProfileCompletenessCard
        percentage={score}
        missingFields={missingFields}
        role="TEACHER"
      />

      {/* Reach Counter Gauge Component */}
      {reachStatus && (
        <ReachGauge
          reachCount={reachStatus.reachCount}
          freeLimit={reachStatus.freeLimit}
          subscriptionState={reachStatus.subscriptionState}
        />
      )}

      {/* 9 Real, Database-Backed Metrics Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-sky-300">إحصائيات الأداء الأكاديمي المباشرة (9 مؤشرات حقيقية):</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
          {/* Metric 1 */}
          <div className="clean-card p-4 space-y-1.5 bg-[#0B1E33]/85 border border-sky-400/25 shadow-lg rounded-2xl backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>زيارات الملف — آخر 30 يومًا</span>
              <Eye className="w-4 h-4 text-sky-400" />
            </div>
            <span className="text-2xl font-black text-white">{profileViews30d}</span>
            <span className="text-[10px] text-slate-400 block">زيارة للملف الشخصي</span>
          </div>

          {/* Metric 2 */}
          <div className="clean-card p-4 space-y-1.5 bg-[#0B1E33]/85 border border-sky-400/25 shadow-lg rounded-2xl backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>الزوار الفريدون — آخر 30 يومًا</span>
              <Users className="w-4 h-4 text-teal-400" />
            </div>
            <span className="text-2xl font-black text-white">{uniqueReach30d}</span>
            <span className="text-[10px] text-slate-400 block">مشاهد مسجل وفريد</span>
          </div>

          {/* Metric 3 */}
          <div className="clean-card p-4 space-y-1.5 bg-[#0B1E33]/85 border border-sky-400/25 shadow-lg rounded-2xl backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>طلبات التواصل مع الموارد</span>
              <Users className="w-4 h-4 text-sky-400" />
            </div>
            <span className="text-2xl font-black text-white">{productInquiriesCount}</span>
            <span className="text-[10px] text-slate-400 block">طلب استفسار وتواصل مباشر</span>
          </div>

          {/* Metric 4 */}
          <div className="clean-card p-4 space-y-1.5 bg-[#0B1E33]/85 border border-sky-400/25 shadow-lg rounded-2xl backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>المنشورات التعليمية</span>
              <Clock className="w-4 h-4 text-sky-400" />
            </div>
            <span className="text-2xl font-black text-white">{postsCount}</span>
            <span className="text-[10px] text-slate-400 block">منشور تعليمي وتوجيهي</span>
          </div>

          {/* Metric 5 */}
          <div className="clean-card p-4 space-y-1.5 bg-[#0B1E33]/85 border border-sky-400/25 shadow-lg rounded-2xl backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>التفاعل مع المنشورات — آخر 30 يومًا</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-2xl font-black text-white">{postInteractions30d}</span>
            <span className="text-[10px] text-slate-400 block">إعجاب وتعليق من التلاميذ</span>
          </div>

          {/* Metric 6 */}
          <div className="clean-card p-4 space-y-1.5 bg-[#0B1E33]/85 border border-sky-400/25 shadow-lg rounded-2xl backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>نقرات التواصل — آخر 30 يومًا</span>
              <ShieldCheck className="w-4 h-4 text-teal-400" />
            </div>
            <span className="text-2xl font-black text-white">{contactClicks30d}</span>
            <span className="text-[10px] text-slate-400 block">نقرة تواصل (واتساب/تيليغرام)</span>
          </div>

          {/* Metric 7 */}
          <div className="clean-card p-4 space-y-1.5 bg-[#0B1E33]/85 border border-sky-400/25 shadow-lg rounded-2xl backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>موارد المتجر المنشورة</span>
              <BookOpen className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-2xl font-black text-white">{productsCount}</span>
            <span className="text-[10px] text-slate-400 block">ملخص وكتاب رقمي نشط</span>
          </div>

          {/* Metric 8 */}
          <div className="clean-card p-4 space-y-1.5 bg-[#0B1E33]/85 border border-sky-400/25 shadow-lg rounded-2xl backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>التقييمات والمراجعات</span>
              <Star className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-2xl font-black text-white">{reviewsCount}</span>
            <span className="text-[10px] text-slate-400 block">مراجعة موثقة من الطلاب</span>
          </div>

          {/* Metric 9 */}
          <div className="clean-card p-4 space-y-1.5 bg-[#0B1E33]/85 border border-sky-400/25 shadow-lg rounded-2xl backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>رصيد الوصول المتاح</span>
              <Eye className="w-4 h-4 text-sky-400" />
            </div>
            <span className="text-2xl font-black text-white">
              {teacher.subscriptionState === 'PRO_ACTIVE' ? 'غير محدود (PRO)' : `${Math.max(0, (reachStatus?.freeLimit || 100) - (reachStatus?.reachCount || 0))} متبقٍ`}
            </span>
            <span className="text-[10px] text-slate-400 block">حالة الحساب: {teacher.subscriptionState === 'PRO_ACTIVE' ? 'PRO نشط' : 'حساب مجاني'}</span>
          </div>
        </div>
      </div>

      {/* Visitor Intelligence: Who viewed my profile */}
      <ProfileVisitorsCard teacherId={teacher.id} />

      {/* Product Viewers Intelligence: Who viewed my store items */}
      <ProductVisitorsAnalytics />

      {/* Interactive Teacher Operational Sections */}
      <TeacherDashboardClient
        teacherId={teacher.id}
        user={user}
        postsCount={postsCount}
        productsCount={productsCount}
        activeSubscription={activeSubscription}
        contactRequests={contactRequests}
      />

      {/* Orders Inbox — طلبات المنتجات */}
      <div className="clean-card p-6 sm:p-8 bg-[#0A1628]/90 border border-cyan-500/25 shadow-2xl backdrop-blur-xl rounded-3xl">
        <OrdersManager />
      </div>
    </div>
  );
}