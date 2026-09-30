'use client';

import React, { useState } from 'react';
import { CreatePostModal } from '@/components/feed/CreatePostModal';
import { ProfileEditorModal } from '@/components/dashboard/ProfileEditorModal';
import { PaymentProofModal } from '@/components/dashboard/PaymentProofModal';
import { CreateProductModal } from '@/components/dashboard/CreateProductModal';
import { SecuritySettings } from '@/components/dashboard/SecuritySettings';
import {
  Newspaper,
  BookOpen,
  Plus,
  UserCheck,
  Edit3,
  ShieldCheck,
  CreditCard,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Clock,
  Send,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export interface TeacherDashboardClientProps {
  teacherId: string;
  user: any;
  postsCount: number;
  productsCount: number;
  activeSubscription?: any;
  contactRequests?: Array<{
    id: string;
    product: { title: string; slug: string };
    user: { fullName: string; email: string; phone: string | null };
    status: string;
    message: string | null;
    createdAt: string | Date;
  }>;
}

export const TeacherDashboardClient: React.FC<TeacherDashboardClientProps> = ({
  teacherId,
  user,
  postsCount,
  productsCount,
  activeSubscription,
  contactRequests = [],
}) => {
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const isVerified = Boolean(user.teacherProfile?.isVerified);
  const isPro = user.teacherProfile?.subscriptionState === 'PRO_ACTIVE';

  return (
    <div className="space-y-8">
      {/* 8 Operational Decision Sections */}

      {/* Section 1: Subscription & Upgrade Actions */}
      <div className="clean-card p-6 bg-gradient-to-r from-[#0D1527] to-[#111D38] border border-sky-500/30 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              {isPro ? 'اشتراك PRO المميز نشط' : 'الترقية إلى باقة PRO الاحترافية'}
            </h3>
          </div>
          <p className="text-xs text-stone-300 leading-relaxed">
            {isPro
              ? 'تتمتع بوصول فريد غير محدود وشارة التميّز وإمكانية إرفاق عينات وفيديوهات للمنتجات.'
              : 'ارفع سقف الوصول وتصدّر نتائج البحث واستقبل استفسارات مباشرة من الطلاب وأولياء الأمور.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={() => setPaymentModalOpen(true)}
            className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-black shadow-md shadow-amber-950/40"
          >
            <CreditCard className="w-4 h-4 text-stone-950" />
            {isPro ? 'تمديد اشتراك PRO' : 'ترقية الحساب إلى PRO'}
          </Button>
        </div>
      </div>

      {/* Section 2: Core Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Profile Management */}
        <div className="clean-card p-6 space-y-4 bg-[#111D38] border border-[#1E3A5F] flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-teal-400" /> إدارة وتعديل الملف
            </h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              تحديث النبذة، المواد، أسعار الدروس ومعلومات التواصل (الهاتف وWhatsApp).
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditProfileOpen(true)}
            className="w-full gap-2 border-slate-700 text-stone-200 hover:bg-slate-800"
          >
            <Edit3 className="w-4 h-4 text-teal-400" /> تعديل الملف الشخصي
          </Button>
        </div>

        {/* Card 2: Feed Posts & Content */}
        <div className="clean-card p-6 space-y-4 bg-[#111D38] border border-[#1E3A5F] flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-teal-400" /> منشورات وإرشادات
              </h3>
              <span className="text-xs text-teal-300 font-bold bg-slate-900 px-2 py-0.5 rounded-lg">
                {postsCount}
              </span>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              نشر نصائح وتمارين وفيديوهات إرشادية للطلاب في الخلاصة العامة.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreatePostOpen(true)}
            className="w-full gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold"
          >
            <Plus className="w-4 h-4" /> إضافة منشور جديد
          </Button>
        </div>

        {/* Card 3: Digital Products */}
        <div className="clean-card p-6 space-y-4 bg-[#111D38] border border-[#1E3A5F] flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-400" /> المنتجات والكتب
              </h3>
              <span className="text-xs text-teal-300 font-bold bg-slate-900 px-2 py-0.5 rounded-lg">
                {productsCount}
              </span>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              نشر كتب رقمية وملخصات بكالوريا للتواصل والاستفسار المباشر.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCreateProductOpen(true)}
              className="w-full gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold"
            >
              <Plus className="w-4 h-4" /> إضافة منتج
            </Button>
            <Link href="/products" className="block">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 border-slate-700 text-stone-200 hover:bg-slate-800"
              >
                <BookOpen className="w-4 h-4" /> تصفح المتجر
              </Button>
            </Link>
          </div>
        </div>

        {/* Card 4: Official Verification Vault */}
        <div className="clean-card p-6 space-y-4 bg-[#111D38] border border-[#1E3A5F] flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" /> حالة التوثيق الرسمي
              </h3>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${isVerified ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-slate-900 text-stone-400'}`}>
                {isVerified ? 'موثق رسمياً' : 'حساب عادي'}
              </span>
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              {isVerified
                ? 'ملفك معتمد وموثق بشارة التوثيق الرسمية في دليل الأساتذة.'
                : 'يتم اعتماد وتوثيق الأساتذة يدوياً من طرف إدارة المنصة.'}
            </p>
          </div>
          <div className="pt-2">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${isVerified ? 'text-amber-400' : 'text-stone-400'}`}>
              <ShieldCheck className="w-4 h-4" /> {isVerified ? 'شارة التوثيق مفعلة' : 'التوثيق يخضع لمراجعة الإدارة'}
            </span>
          </div>
        </div>
      </div>

      {/* Section 3: Direct Student Inquiries Table ("تواصل الآن") */}
      <div className="clean-card p-6 bg-[#111D38] border border-[#1E3A5F] rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-teal-400" />
            <h3 className="text-lg font-black text-white">استفسارات الطلاب المباشرة (تواصل الآن)</h3>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-teal-950/80 border border-teal-700 text-teal-300 rounded-lg">
            {contactRequests.length} استفسار مسجل
          </span>
        </div>

        {contactRequests.length === 0 ? (
          <div className="p-8 text-center bg-[#0D1527] rounded-xl border border-slate-800 space-y-2">
            <MessageSquare className="w-8 h-8 text-stone-600 mx-auto" />
            <p className="text-sm text-stone-300 font-bold">لا توجد استفسارات جديدة مسجلة حالياً</p>
            <p className="text-xs text-stone-500">
              عندما يضغط تلميذ أو ولي أمر على زر "تواصل الآن" في أي منتج تعليمي يخصك، ستظهر بياناته ورسالته هنا فوراً.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-stone-400">
                  <th className="pb-3 pr-2 font-bold">التلميذ / الطالب</th>
                  <th className="pb-3 font-bold">المادة أو المنتج</th>
                  <th className="pb-3 font-bold">رقم الهاتف</th>
                  <th className="pb-3 font-bold">الرسالة</th>
                  <th className="pb-3 font-bold">التاريخ</th>
                  <th className="pb-3 pl-2 font-bold">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {contactRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-900/50">
                    <td className="py-3.5 pr-2 font-bold text-white">{req.user.fullName}</td>
                    <td className="py-3.5 text-teal-300 font-semibold">{req.product.title}</td>
                    <td className="py-3.5 font-mono text-stone-300">{req.user.phone || 'غير مسجل'}</td>
                    <td className="py-3.5 text-stone-300 max-w-xs truncate">{req.message || 'استفسار مباشر'}</td>
                    <td className="py-3.5 text-stone-400">
                      {new Date(req.createdAt).toLocaleDateString('ar-DZ')}
                    </td>
                    <td className="py-3.5 pl-2">
                      {req.user.phone ? (
                        <a
                          href={`tel:${req.user.phone}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-950 hover:bg-teal-900 border border-teal-700 text-teal-300 rounded-lg font-bold"
                        >
                          اتصال
                        </a>
                      ) : (
                        <span className="text-stone-500">مباشر</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreatePostModal
        isOpen={createPostOpen}
        onClose={() => setCreatePostOpen(false)}
        onPostCreated={() => window.location.reload()}
      />

      {/* Security Settings Section */}
      <div className="clean-card p-6 bg-[#111D38] border border-[#1E3A5F] rounded-2xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Lock className="w-5 h-5 text-teal-400" />
          إعدادات الأمان والحساب
        </h2>
        <SecuritySettings />
      </div>

      <CreateProductModal
        isOpen={createProductOpen}
        onClose={() => setCreateProductOpen(false)}
        onSuccess={() => window.location.reload()}
      />

      <ProfileEditorModal
        isOpen={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        user={user}
        onProfileUpdated={() => window.location.reload()}
      />

      <PaymentProofModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
};