'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Activity } from 'lucide-react';

interface AdminKPIMatrixProps {
  totalUsers: number;
  teachersCount: number;
  studentsCount: number;
  parentsCount: number;
  activeProTeachers: number;
  freeActiveTeachers: number;
  frozenTeachers: number;
  expiredProTeachers: number;
  verifiedTeachers: number;
  pendingDocsCount: number;
  pendingPaymentsCount: number;
  todayPostsCount: number;
  activeProductsCount: number;
  productContactsCount: number;
  totalApprovedRevenue: number;
}

interface KPICardProps {
  label: string;
  value: string | number;
  colorClass?: string;
  borderClass?: string;
  onClick?: () => void;
  clickable?: boolean;
}

function KPICard({ label, value, colorClass = 'text-white', borderClass = 'border-[#1E3A5F]', onClick, clickable }: KPICardProps) {
  return (
    <div
      onClick={onClick}
      className={`clean-card p-3 bg-[#111D38] border ${borderClass} space-y-0.5 transition-all duration-200 ${
        clickable
          ? 'cursor-pointer hover:brightness-125 hover:scale-[1.02] hover:shadow-lg hover:shadow-sky-500/10 active:scale-[0.98]'
          : ''
      }`}
      title={clickable ? 'انقر للفلترة في قائمة المستخدمين' : undefined}
    >
      <span className="text-[11px] text-stone-400 font-bold block">{label}</span>
      <span className={`text-2xl font-black ${colorClass} block`}>{value}</span>
      {clickable && (
        <span className="text-[9px] text-sky-400/60 font-bold">← انقر للفلترة</span>
      )}
    </div>
  );
}

export function AdminKPIMatrix({
  totalUsers,
  teachersCount,
  studentsCount,
  parentsCount,
  activeProTeachers,
  freeActiveTeachers,
  frozenTeachers,
  expiredProTeachers,
  verifiedTeachers,
  pendingDocsCount,
  pendingPaymentsCount,
  todayPostsCount,
  activeProductsCount,
  productContactsCount,
  totalApprovedRevenue,
}: AdminKPIMatrixProps) {
  const router = useRouter();

  const drillDown = (status?: string, role?: string) => {
    const params = new URLSearchParams();
    params.set('tab', 'USERS');
    if (status) params.set('status', status);
    if (role) params.set('role', role);
    router.push(`/admin?${params.toString()}`);
  };

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold text-stone-300 flex items-center gap-2">
        <Activity className="w-4 h-4 text-amber-400" /> مصفوفة المؤشرات التشغيلية الـ 15 (Operational KPIs)
        <span className="text-[10px] text-sky-400/70 font-normal">(البطاقات الملوّنة قابلة للنقر لفلترة المستخدمين)</span>
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KPICard label="1. إجمالي المستخدمين" value={totalUsers} colorClass="text-white" clickable onClick={() => drillDown()} />
        <KPICard label="2. الأساتذة" value={teachersCount} colorClass="text-teal-300" clickable onClick={() => drillDown(undefined, 'TEACHER')} />
        <KPICard label="3. الطلاب والتلاميذ" value={studentsCount} colorClass="text-indigo-300" clickable onClick={() => drillDown(undefined, 'STUDENT')} />
        <KPICard label="4. أولياء الأمور" value={parentsCount} colorClass="text-amber-300" clickable onClick={() => drillDown(undefined, 'PARENT')} />

        <KPICard
          label="5. باقة PRO النشطة"
          value={activeProTeachers}
          colorClass="text-sky-400"
          borderClass="border-sky-500/40"
          clickable
          onClick={() => drillDown('PRO_ACTIVE')}
        />

        <KPICard
          label="6. حسابات مجانية نشطة"
          value={freeActiveTeachers}
          colorClass="text-stone-300"
          clickable
          onClick={() => drillDown('FREE_ACTIVE')}
        />

        <KPICard
          label="7. حسابات مجمدة"
          value={frozenTeachers}
          colorClass="text-rose-400"
          borderClass="border-rose-900/40"
          clickable
          onClick={() => drillDown('FROZEN')}
        />

        <KPICard
          label="8. باقة PRO منتهية"
          value={expiredProTeachers}
          colorClass="text-amber-400"
          borderClass="border-amber-900/40"
          clickable
          onClick={() => drillDown('PRO_EXPIRED')}
        />

        <KPICard
          label="9. أساتذة موثقون"
          value={verifiedTeachers}
          colorClass="text-teal-400"
          borderClass="border-teal-600/40"
          clickable
          onClick={() => drillDown('VERIFIED')}
        />

        <KPICard label="10. وثائق قيد التدقيق" value={pendingDocsCount} colorClass="text-amber-400" borderClass="border-amber-500/40" />
        <KPICard label="11. إيصالات دفع قيد المراجعة" value={pendingPaymentsCount} colorClass="text-emerald-400" borderClass="border-emerald-500/40" />
        <KPICard label="12. منشورات اليوم" value={todayPostsCount} colorClass="text-white" />
        <KPICard label="13. المنتجات المنشورة" value={activeProductsCount} colorClass="text-white" />
        <KPICard label="14. طلبات تواصل المنتجات" value={productContactsCount} colorClass="text-teal-400" borderClass="border-teal-500/40" />
        <KPICard
          label="15. الإيرادات المعتمدة"
          value={`${totalApprovedRevenue.toLocaleString()} دج`}
          colorClass="text-amber-400"
          borderClass="border-amber-500/40"
        />
      </div>
    </div>
  );
}
