import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole, SubscriptionState, PaymentProofStatus } from '@/types';
import { ShieldCheck, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { AdminOperationsClient } from '@/components/admin/AdminOperationsClient';
import { AdminKPIMatrix } from '@/components/admin/AdminKPIMatrix';
import {
  getAlgiersDateString,
  getAlgiersYesterdayDateString,
  getAlgiersStartOfMonth,
} from '@/lib/algiersTime';

export const revalidate = 0;

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== UserRole.ADMIN) {
    redirect('/login');
  }

  // 1. Authentic Traffic Analytics in Africa/Algiers timezone
  const todayStr = getAlgiersDateString();
  const yesterdayStr = getAlgiersYesterdayDateString();
  const startOfMonth = getAlgiersStartOfMonth();

  const [todayVisits, yesterdayVisits, monthVisits] = await Promise.all([
    prisma.userDailyVisit.count({ where: { dateStr: todayStr } }),
    prisma.userDailyVisit.count({ where: { dateStr: yesterdayStr } }),
    prisma.userDailyVisit.count({ where: { createdAt: { gte: startOfMonth } } }),
  ]);

  // 2. Comprehensive 15-Metric Breakdown
  const [
    totalUsers,
    teachersCount,
    studentsCount,
    parentsCount,
    activeProTeachers,
    freeActiveTeachers,
    frozenTeachers,
    expiredProTeachers,
    verifiedTeachers,
    pendingPaymentsCount,
    todayPostsCount,
    activeProductsCount,
    productContactsCount,
    reviewsCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.teacherProfile.count(),
    prisma.studentProfile.count(),
    prisma.parentProfile.count(),
    prisma.teacherProfile.count({ where: { subscriptionState: SubscriptionState.PRO_ACTIVE } }),
    prisma.teacherProfile.count({ where: { subscriptionState: SubscriptionState.FREE_ACTIVE } }),
    prisma.teacherProfile.count({ where: { subscriptionState: SubscriptionState.FROZEN } }),
    prisma.teacherProfile.count({ where: { subscriptionState: SubscriptionState.PRO_EXPIRED } }),
    prisma.teacherProfile.count({ where: { isVerified: true } }),
    prisma.paymentProof.count({ where: { status: PaymentProofStatus.PENDING } }),
    prisma.post.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    prisma.product.count({ where: { isPublished: true } }),
    prisma.productContactRequest.count(),
    prisma.review.count({ where: { status: 'PUBLISHED' } }),
  ]);
  const pendingDocsCount = 0;

  // 3. Real Approved Financial Revenue
  const approvedProofs = await prisma.paymentProof.findMany({
    where: { status: PaymentProofStatus.APPROVED },
    select: { amount: true },
  });
  const totalApprovedRevenue = approvedProofs.reduce((sum, p) => sum + p.amount, 0);

  // 4. Pending Payment Proofs for Operations Review
  const pendingPaymentProofs = await prisma.paymentProof.findMany({
    where: { status: PaymentProofStatus.PENDING },
    include: {
      teacher: {
        select: {
          id: true,
          headline: true,
          phone: true,
          user: {
            select: {
              fullName: true,
              email: true,
              wilaya: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // 6. Community Reports for Moderation
  const initialCommunityReports = await prisma.communityReport.findMany({
    include: {
      reporter: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // 7. Persistent Admin Audit Logs
  const initialAuditLogs = await prisma.auditLog.findMany({
    include: {
      actor: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  // 8. Platform Settings
  const settings = await prisma.platformSetting.findMany();
  const settingsMap = settings.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  const freeReachLimit = settingsMap['trialDurationDays'] || '30';
  const proPriceDZD = settingsMap['proPriceDZD'] || '900';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-stone-100" dir="rtl">
      {/* Admin Header */}
      <div className="clean-card p-6 border-r-4 border-r-amber-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#111D38] border border-[#1E3A5F]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-amber-500/40 text-amber-400 flex items-center justify-center font-black text-xl shadow-sm">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              لوحة التحكم المركزية (PROF DZ Administrative Cockpit)
            </h1>
            <p className="text-xs text-stone-300 font-medium">
              المدير المسؤول: <strong className="text-amber-300">{user.fullName}</strong> ({user.email}) — رصد 15 مؤشراً تشغيلياً معتمداً.
            </p>
          </div>
        </div>
        <Badge variant="amber" size="md" className="font-bold">ADMIN ACCESS ACTIVE</Badge>
      </div>

      {/* 1. Timezone-Specific Traffic Analytics (Africa/Algiers Calendar Cards) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-teal-400 flex items-center gap-2">
            <Clock className="w-4 h-4" /> حركة الزوار المسجلين اليومية (توقيت الجزائر Africa/Algiers)
          </h2>
          <span className="text-[11px] text-stone-400 font-mono">اليوم: {todayStr}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="clean-card p-4 bg-[#111D38] border border-[#1E3A5F] space-y-1">
            <span className="text-xs text-stone-400 font-bold">زوار اليوم المسجلون (من 00:00 إلى الآن)</span>
            <span className="text-3xl font-black text-teal-400 block">{todayVisits}</span>
          </div>

          <div className="clean-card p-4 bg-[#111D38] border border-[#1E3A5F] space-y-1">
            <span className="text-xs text-stone-400 font-bold">زوار الأمس المسجلون (24 ساعة كاملة)</span>
            <span className="text-3xl font-black text-stone-200 block">{yesterdayVisits}</span>
          </div>

          <div className="clean-card p-4 bg-[#111D38] border border-[#1E3A5F] space-y-1">
            <span className="text-xs text-stone-400 font-bold">إجمالي زوار الشهر الحالي (الشهر النشط)</span>
            <span className="text-3xl font-black text-amber-400 block">{monthVisits}</span>
          </div>
        </div>
      </div>

      {/* 2. Platform 15 Operational Metrics Matrix — clickable for drill-down */}
      <AdminKPIMatrix
        totalUsers={totalUsers}
        teachersCount={teachersCount}
        studentsCount={studentsCount}
        parentsCount={parentsCount}
        activeProTeachers={activeProTeachers}
        freeActiveTeachers={freeActiveTeachers}
        frozenTeachers={frozenTeachers}
        expiredProTeachers={expiredProTeachers}
        verifiedTeachers={verifiedTeachers}
        pendingDocsCount={pendingDocsCount}
        pendingPaymentsCount={pendingPaymentsCount}
        todayPostsCount={todayPostsCount}
        activeProductsCount={activeProductsCount}
        productContactsCount={productContactsCount}
        totalApprovedRevenue={totalApprovedRevenue}
      />

      {/* 3. Operations Tables: Payment Proofs & Reports & Settings & Audit */}
      <AdminOperationsClient
        initialPaymentProofs={pendingPaymentProofs as any}
        initialCommunityReports={initialCommunityReports as any}
        initialAuditLogs={initialAuditLogs as any}
        initialFreeReachLimit={freeReachLimit}
        initialProPriceDZD={proPriceDZD}
        initialPaymentSettings={{
          ccpAccount: settingsMap['ccpAccount'] || '',
          ccpKey: settingsMap['ccpKey'] || '',
          baridiMobRip: settingsMap['baridiMobRip'] || '',
          accountHolderName: settingsMap['accountHolderName'] || '',
          aboutPlatformVideoUrl: settingsMap['aboutPlatformVideoUrl'] || '',
        }}
      />
    </div>
  );
}
