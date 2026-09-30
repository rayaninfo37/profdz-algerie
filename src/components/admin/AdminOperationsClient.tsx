'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck, Landmark, FileText, CheckCircle2, XCircle, ExternalLink, Settings, AlertCircle, RefreshCw, Flag, Check, Ban, MessageSquare, History, Users, Video, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';

import { AdminUsersManager } from './AdminUsersManager';

interface PaymentProofItem {
  id: string;
  amount: number;
  currency: string;
  receiptUrl: string;
  transactionRef?: string | null;
  status: string;
  createdAt: string | Date;
  teacher: {
    id: string;
    headline?: string | null;
    phone?: string | null;
    user: {
      fullName: string;
      email: string;
      phone?: string | null;
      wilaya?: string | null;
    };
  };
}

export interface CommunityReportItem {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  details?: string | null;
  status: string;
  adminNotes?: string | null;
  createdAt: string | Date;
  reporter: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
}

export interface AuditLogItem {
  id: string;
  action: string;
  target: string;
  details?: string | null;
  createdAt: string | Date;
  actor: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
}

interface AdminOperationsClientProps {
  initialPaymentProofs: PaymentProofItem[];
  initialCommunityReports?: CommunityReportItem[];
  initialAuditLogs?: AuditLogItem[];
  initialFreeReachLimit: string;
  initialProPriceDZD: string;
  initialPaymentSettings?: {
    ccpAccount: string;
    ccpKey: string;
    baridiMobRip: string;
    accountHolderName: string;
    aboutPlatformVideoUrl?: string;
  };
}

export const AdminOperationsClient: React.FC<AdminOperationsClientProps> = ({
  initialPaymentProofs,
  initialCommunityReports = [],
  initialAuditLogs = [],
  initialFreeReachLimit,
  initialProPriceDZD,
  initialPaymentSettings,
}) => {
  const toast = useToast();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<'USERS' | 'PAYMENTS' | 'REPORTS' | 'SETTINGS' | 'AUDIT'>('PAYMENTS');
  const [userFilterRole, setUserFilterRole] = useState<string>('');
  const [userFilterStatus, setUserFilterStatus] = useState<string>('');
  const [paymentProofs, setPaymentProofs] = useState<PaymentProofItem[]>(initialPaymentProofs);
  const [communityReports, setCommunityReports] = useState<CommunityReportItem[]>(initialCommunityReports);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(initialAuditLogs);
  const [auditFilter, setAuditFilter] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Read URL search params on mount/change to support KPI card drill-down navigation
  useEffect(() => {
    const tab = searchParams.get('tab');
    const status = searchParams.get('status');
    const role = searchParams.get('role');

    if (tab === 'USERS') {
      setActiveTab('USERS');
      setUserFilterStatus(status || '');
      setUserFilterRole(role || '');
    }
  }, [searchParams]);

  // Settings state
  const [freeReachLimit, setFreeReachLimit] = useState(initialFreeReachLimit);
  const [proPriceDZD, setProPriceDZD] = useState(initialProPriceDZD);
  const [ccpAccount, setCcpAccount] = useState(initialPaymentSettings?.ccpAccount || '');
  const [ccpKey, setCcpKey] = useState(initialPaymentSettings?.ccpKey || '');
  const [baridiMobRip, setBaridiMobRip] = useState(initialPaymentSettings?.baridiMobRip || '');
  const [accountHolderName, setAccountHolderName] = useState(initialPaymentSettings?.accountHolderName || '');
  const [aboutPlatformVideoUrl, setAboutPlatformVideoUrl] = useState(initialPaymentSettings?.aboutPlatformVideoUrl || '');
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('الملف المختار ليس فيديو صالحاً. يُسمح فقط بصيغ MP4 أو WebM.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('حجم الفيديو يتجاوز الحد الأقصى المسموح به (50 ميغابايت).');
      return;
    }

    setUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'about-video');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success && data.url) {
        setAboutPlatformVideoUrl(data.url);
        toast.success('تم رفع الفيديو المحلي بنجاح! احفظ الإعدادات لتثبيت التغيير.');
      } else {
        toast.error(data.error || 'فشل رفع الفيديو.');
      }
    } catch {
      toast.error('حدث خطأ في الاتصال بالخادم أثناء رفع الفيديو.');
    } finally {
      setUploadingVideo(false);
      e.target.value = '';
    }
  };

  // Community report resolution handler
  const handleUpdateReportStatus = async (reportId: string, status: 'RESOLVED' | 'DISMISSED') => {
    setLoadingId(reportId);
    try {
      const res = await fetch(`/api/admin/community/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          adminNotes: status === 'RESOLVED' ? 'تمت معالجة البلاغ واتخاذ الإجراء المناسب.' : 'تم فحص البلاغ ورفضه لعدم مخالفته القواعد.',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(status === 'RESOLVED' ? 'تمت معالجة البلاغ بنجاح.' : 'تم رفض/تجاهل البلاغ.');
        setCommunityReports((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, status } : r))
        );
      } else {
        toast.error(data.error || 'فشل تحديث حالة البلاغ.');
      }
    } catch {
      toast.error('حدث خطأ في الشبكة.');
    } finally {
      setLoadingId(null);
    }
  };

  // In-app rejection modal dialog state (replaces window.prompt)
  const [rejectDialog, setRejectDialog] = useState<{
    isOpen: boolean;
    type: 'PAYMENT' | 'VERIFICATION' | null;
    id: string | null;
    title: string;
    reason: string;
    isSubmitting: boolean;
  }>({
    isOpen: false,
    type: null,
    id: null,
    title: '',
    reason: '',
    isSubmitting: false,
  });

  // Approve Payment Proof
  const handleApprovePayment = async (proofId: string) => {
    setLoadingId(proofId);
    try {
      const res = await fetch(`/api/admin/operations/payments/${proofId}/approve`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'تم اعتماد الوصل وتفعيل اشتراك PRO بنجاح.');
        setPaymentProofs((prev) => prev.filter((p) => p.id !== proofId));
      } else {
        toast.error(data.error || 'فشل اعتماد الوصل.');
      }
    } catch {
      toast.error('حدث خطأ في الشبكة أثناء المعالجة.');
    } finally {
      setLoadingId(null);
    }
  };

  // Open rejection dialog for payment proof
  const openRejectPaymentDialog = (proofId: string) => {
    setRejectDialog({
      isOpen: true,
      type: 'PAYMENT',
      id: proofId,
      title: 'رفض وصل تحويل الاشتراك (Payment Proof Rejection)',
      reason: '',
      isSubmitting: false,
    });
  };

  // Open rejection dialog for verification doc
  const openRejectDocDialog = (docId: string) => {
    setRejectDialog({
      isOpen: true,
      type: 'VERIFICATION',
      id: docId,
      title: 'رفض وثيقة التوثيق والشهادة (Document Rejection)',
      reason: '',
      isSubmitting: false,
    });
  };

  // Confirm rejection through in-app dialog
  const handleConfirmRejection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectDialog.id || !rejectDialog.type) return;

    if (!rejectDialog.reason.trim()) {
      toast.error('يرجى كتابة سبب الرفض لتوضيحه للأستاذ.');
      return;
    }

    setRejectDialog((prev) => ({ ...prev, isSubmitting: true }));
    const targetId = rejectDialog.id;
    const targetType = rejectDialog.type;
    const reasonText = rejectDialog.reason.trim();

    try {
      if (targetType === 'PAYMENT') {
        const res = await fetch(`/api/admin/operations/payments/${targetId}/reject`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: reasonText }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          toast.info(data.message || 'تم رفض الوصل وإشعار الأستاذ بنجاح.');
          setPaymentProofs((prev) => prev.filter((p) => p.id !== targetId));
          setRejectDialog({ isOpen: false, type: null, id: null, title: '', reason: '', isSubmitting: false });
        } else {
          toast.error(data.error || 'فشل رفض الوصل.');
        }
      }
    } catch {
      toast.error('حدث خطأ أثناء تنفيذ عملية الرفض.');
    } finally {
      setRejectDialog((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            trialDurationDays: freeReachLimit,
            proPriceDZD: proPriceDZD,
            ccpAccount: ccpAccount.trim(),
            ccpKey: ccpKey.trim(),
            baridiMobRip: baridiMobRip.trim(),
            accountHolderName: accountHolderName.trim(),
            aboutPlatformVideoUrl: aboutPlatformVideoUrl.trim(),
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('تم حفظ إعدادات المنظومة وبيانات الدفع بنجاح!');
      } else {
        toast.error(data.error || 'فشل حفظ الإعدادات.');
      }
    } catch {
      toast.error('حدث خطأ في الشبكة.');
    } finally {
      setSavingSettings(false);
    }
  };

  const pendingPaymentsCount = paymentProofs.length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Navigation Tabs Bar */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => {
            setUserFilterRole('');
            setUserFilterStatus('');
            setActiveTab('USERS');
          }}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs transition-colors ${
            activeTab === 'USERS'
              ? 'bg-teal-600 text-white shadow-lg'
              : 'bg-slate-900 text-stone-300 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          إدارة الحسابات والمستخدمين (Users)
        </button>

        <button
          onClick={() => setActiveTab('PAYMENTS')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs transition-colors ${
            activeTab === 'PAYMENTS'
              ? 'bg-amber-600 text-white shadow-lg'
              : 'bg-slate-900 text-stone-300 hover:text-white'
          }`}
        >
          <Landmark className="w-4 h-4" />
          إيصالات الاشتراكات المعلقة (Payment Proofs)
          {pendingPaymentsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-950 border border-amber-400 text-amber-200">
              {pendingPaymentsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('REPORTS')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs transition-colors ${
            activeTab === 'REPORTS'
              ? 'bg-rose-600 text-white shadow-lg'
              : 'bg-slate-900 text-stone-300 hover:text-white'
          }`}
        >
          <Flag className="w-4 h-4" />
          البلاغات والشكاوى (Community Reports)
          {communityReports.filter((r) => r.status === 'PENDING').length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-950 border border-rose-400 text-rose-200">
              {communityReports.filter((r) => r.status === 'PENDING').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs transition-colors ${
            activeTab === 'SETTINGS'
              ? 'bg-slate-700 text-white shadow-lg'
              : 'bg-slate-900 text-stone-300 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          إعدادات المنظومة (Platform Settings)
        </button>

        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs transition-colors ${
            activeTab === 'AUDIT'
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'bg-slate-900 text-stone-300 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          سجل العمليات والتدقيق (Admin Audit Trail)
          {auditLogs.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-950 border border-indigo-400 text-indigo-200">
              {auditLogs.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB: Users Management */}
      {activeTab === 'USERS' && (
        <AdminUsersManager
          initialFilterRole={userFilterRole}
          initialFilterStatus={userFilterStatus}
        />
      )}

      {/* TAB 1: Payment Proofs Table */}
      {activeTab === 'PAYMENTS' && (
        <div className="clean-card p-6 bg-[#111D38] border border-[#1E3A5F] rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Landmark className="w-5 h-5 text-amber-400" />
              قائمة إيصالات التحويل المعلقة للمراجعة والاعتماد ({pendingPaymentsCount})
            </h2>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="border-slate-700 text-stone-300 gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> تحديث القائمة
            </Button>
          </div>

          {pendingPaymentsCount > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-stone-400">
                    <th className="py-3 px-4">الأستاذ</th>
                    <th className="py-3 px-4">الولاية / الهاتف</th>
                    <th className="py-3 px-4">المبلغ</th>
                    <th className="py-3 px-4">مرجع العملية</th>
                    <th className="py-3 px-4">ملف الوصل</th>
                    <th className="py-3 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {paymentProofs.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">
                        {p.teacher.user.fullName}
                        <span className="block text-[11px] text-stone-400 font-normal">{p.teacher.user.email}</span>
                      </td>
                      <td className="py-3.5 px-4 text-stone-300">
                        {p.teacher.user.wilaya || 'غير محدد'}
                        <span className="block text-[11px] text-stone-400 font-mono">{p.teacher.user.phone || '—'}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-amber-400 font-mono">
                        {p.amount.toLocaleString()} دج
                      </td>
                      <td className="py-3.5 px-4 text-stone-400 font-mono">
                        {p.transactionRef || 'غير مدخل'}
                      </td>
                      <td className="py-3.5 px-4">
                        <a
                          href={`/api/documents/${p.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-teal-300 font-bold transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> استعراض الوصل
                        </a>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            isLoading={loadingId === p.id}
                            onClick={() => handleApprovePayment(p.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 text-[11px] py-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> اعتماد وتفعيل PRO
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={loadingId === p.id}
                            onClick={() => openRejectPaymentDialog(p.id)}
                            className="border-rose-800/60 text-rose-300 hover:bg-rose-950 font-bold gap-1 text-[11px] py-1"
                          >
                            <XCircle className="w-3.5 h-3.5" /> رفض
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-stone-400 text-xs bg-slate-900/60 rounded-xl">
              لا توجد إيصالات اشتراك معلقة حالياً. جميع الطلبات معالجة بالكامل.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: System & Payment Settings */}
      {activeTab === 'SETTINGS' && (
        <form onSubmit={handleSaveSettings} className="clean-card p-6 bg-[#111D38] border border-[#1E3A5F] rounded-2xl space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-400" />
              إعدادات المنصة التشغيلية والمالية (Platform Settings)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-stone-300">
                فترة التجربة المجانية للأساتذة الجدد (أيام)
              </label>
              <input
                type="number"
                min="1"
                value={freeReachLimit}
                onChange={(e) => setFreeReachLimit(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-stone-300">
                سعر الاشتراك الشهري PRO (دج)
              </label>
              <input
                type="number"
                min="0"
                value={proPriceDZD}
                onChange={(e) => setProPriceDZD(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-stone-300">
                رقم الحساب البريدي الجاري (CCP)
              </label>
              <input
                type="text"
                value={ccpAccount}
                onChange={(e) => setCcpAccount(e.target.value)}
                placeholder="مثال: 0012345678"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-stone-300">
                مفتاح الحساب البريدي الجاري (Clé CCP)
              </label>
              <input
                type="text"
                value={ccpKey}
                onChange={(e) => setCcpKey(e.target.value)}
                placeholder="مثال: 25"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-stone-300">
                رقم الحساب البريدي بريدي موب (RIP BaridiMob)
              </label>
              <input
                type="text"
                value={baridiMobRip}
                onChange={(e) => setBaridiMobRip(e.target.value)}
                placeholder="مثال: 00799999001234567890"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-stone-300">
                اسم المستفيد الرسمي (Account Holder Name)
              </label>
              <input
                type="text"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                placeholder="مثال: PROF DZ"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>
          </div>

            <div className="border-t border-slate-800 pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                  <Video className="w-4 h-4" /> الفيديو التعريفي للمنصة (About Platform Video)
                </h3>
                {aboutPlatformVideoUrl && (
                  <button
                    type="button"
                    onClick={() => setAboutPlatformVideoUrl('')}
                    className="text-[11px] text-rose-400 hover:text-rose-300 font-bold transition-colors"
                  >
                    إعادة تعيين إلى الفيديو السينمائي الافتراضي
                  </button>
                )}
              </div>

              {/* Option A: YouTube URL */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-300">
                  الخيار 1: رابط فيديو YouTube (YouTube URL)
                </label>
                <input
                  type="text"
                  value={aboutPlatformVideoUrl}
                  onChange={(e) => setAboutPlatformVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... أو /uploads/public/videos/..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono placeholder-stone-500"
                />
              </div>

              {/* Option B: Local Direct Video Upload */}
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                <label className="text-[11px] font-bold text-teal-300 block">
                  الخيار 2: رفع ملف فيديو محلي للمنصة مباشرة (Direct Local MP4/WebM حتى 50MB)
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <label className={`cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                    uploadingVideo
                      ? 'bg-slate-800 border-slate-700 text-stone-500 cursor-not-allowed'
                      : 'bg-teal-600 hover:bg-teal-500 text-white border-teal-500 shadow-md shadow-teal-500/20'
                  }`}>
                    <Upload className="w-4 h-4" />
                    {uploadingVideo ? 'جاري رفع ومعالجة الفيديو...' : 'اختر ملف فيديو لرفعه محلياً'}
                    <input
                      type="file"
                      accept="video/mp4,video/webm"
                      disabled={uploadingVideo}
                      onChange={handleVideoUpload}
                      className="hidden"
                    />
                  </label>

                  {aboutPlatformVideoUrl && aboutPlatformVideoUrl.startsWith('/uploads/') && (
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-1.5 rounded-lg border border-emerald-800/60 truncate max-w-sm">
                      ملف محلي نشط: {aboutPlatformVideoUrl}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-stone-400">
                  قواعد الأسبقية: يتم تشغيل الفيديو المحلي المرفوع كأولوية أولى، وفي حال عدم وجوده يتم تشغيل رابط YouTube، وإذا لم يُضبط كلاهما يتم تشغيل الفيديو السينمائي الرسمي تلقائياً.
                </p>
              </div>
            </div>

          <div className="pt-2">
            <Button variant="primary" size="md" isLoading={savingSettings} type="submit" className="bg-teal-600 hover:bg-teal-700 text-white font-bold">
              حفظ وتطبيق التغييرات
            </Button>
          </div>
        </form>
      )}

      {/* TAB 4: Community Reports Table */}
      {activeTab === 'REPORTS' && (
        <div className="clean-card p-6 bg-[#111D38] border border-[#1E3A5F] rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Flag className="w-5 h-5 text-rose-400" />
              قائمة بلاغات وشكاوى المجتمع ({communityReports.length})
            </h2>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="border-slate-700 text-stone-300 gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> تحديث القائمة
            </Button>
          </div>

          {communityReports.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-stone-400">
                    <th className="py-3 px-4">المُبَلّغ</th>
                    <th className="py-3 px-4">النوع / الهدف</th>
                    <th className="py-3 px-4">سبب البلاغ والتفاصيل</th>
                    <th className="py-3 px-4">التاريخ</th>
                    <th className="py-3 px-4">الحالة</th>
                    <th className="py-3 px-4 text-center">إجراءات المعالجة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {communityReports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-white">
                        <div>{report.reporter.fullName}</div>
                        <div className="text-[10px] text-stone-400">{report.reporter.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-teal-300 border border-slate-700">
                          {report.targetType} #{report.targetId.slice(0, 8)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-rose-300">{report.reason}</div>
                        {report.details && (
                          <div className="text-[11px] text-stone-300 truncate" title={report.details}>
                            {report.details}
                          </div>
                        )}
                        {report.adminNotes && (
                          <div className="text-[10px] text-amber-400 mt-0.5">
                            ملاحظة الإدارة: {report.adminNotes}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-stone-400 font-mono text-[11px]">
                        {new Date(report.createdAt).toLocaleDateString('ar-DZ')}
                      </td>
                      <td className="py-3.5 px-4">
                        {report.status === 'PENDING' && (
                          <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/50">
                            قيد المراجعة
                          </span>
                        )}
                        {report.status === 'RESOLVED' && (
                          <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-teal-950/80 text-teal-300 border border-teal-500/50">
                            تمت المعالجة
                          </span>
                        )}
                        {report.status === 'DISMISSED' && (
                          <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-stone-400 border border-slate-700">
                            مرفوض / مستبعد
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {report.status === 'PENDING' ? (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                disabled={loadingId === report.id}
                                onClick={() => handleUpdateReportStatus(report.id, 'RESOLVED')}
                                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs h-7 px-2.5 gap-1"
                              >
                                <Check className="w-3 h-3" /> معالجة
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={loadingId === report.id}
                                onClick={() => handleUpdateReportStatus(report.id, 'DISMISSED')}
                                className="border-slate-700 text-stone-300 hover:bg-slate-800 text-xs h-7 px-2.5 gap-1"
                              >
                                <Ban className="w-3 h-3 text-stone-400" /> رفض
                              </Button>
                            </>
                          ) : (
                            <span className="text-[10px] text-stone-500">تم البت في البلاغ</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-stone-400 space-y-1">
              <CheckCircle2 className="w-8 h-8 text-teal-400 mx-auto opacity-70" />
              <p>لا توجد أي بلاغات حالياً. بيئة المجتمع آمنة ومنضبطة.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: Admin Audit Trail Table */}
      {activeTab === 'AUDIT' && (
        <div className="clean-card p-6 bg-[#111D38] border border-[#1E3A5F] rounded-2xl space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-400" />
                سجل العمليات والقرارات الإدارية الموثقة (Admin Audit Trail) ({auditLogs.length})
              </h2>
              <p className="text-[11px] text-stone-400 mt-0.5">
                سجل دائم غير قابل للتعديل يوثق عمليات الاعتماد والرفض وتعديل الصلاحيات والإعدادات بهوية المدير والوقت.
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
                placeholder="بحث في الإجراء أو التفاصيل أو الفاعل..."
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 w-full sm:w-64"
              />
              <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="border-slate-700 text-stone-300 gap-1 shrink-0 text-xs">
                <RefreshCw className="w-3 h-3" /> تحديث
              </Button>
            </div>
          </div>

          {auditLogs.filter((log) => {
            if (!auditFilter.trim()) return true;
            const term = auditFilter.toLowerCase();
            return (
              log.action.toLowerCase().includes(term) ||
              (log.details && log.details.toLowerCase().includes(term)) ||
              log.actor.fullName.toLowerCase().includes(term) ||
              log.actor.email.toLowerCase().includes(term)
            );
          }).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-stone-400">
                    <th className="py-3 px-4">الإجراء الإداري</th>
                    <th className="py-3 px-4">المدير المسؤول</th>
                    <th className="py-3 px-4">الهدف / المعرف</th>
                    <th className="py-3 px-4">تفاصيل العملية</th>
                    <th className="py-3 px-4">التاريخ والوقت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {auditLogs
                    .filter((log) => {
                      if (!auditFilter.trim()) return true;
                      const term = auditFilter.toLowerCase();
                      return (
                        log.action.toLowerCase().includes(term) ||
                        (log.details && log.details.toLowerCase().includes(term)) ||
                        log.actor.fullName.toLowerCase().includes(term) ||
                        log.actor.email.toLowerCase().includes(term)
                      );
                    })
                    .map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-500/40">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white font-medium">
                          <div>{log.actor.fullName}</div>
                          <div className="text-[10px] text-stone-400">{log.actor.email}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-teal-300">
                          {log.target}
                        </td>
                        <td className="py-3 px-4 text-stone-300 max-w-sm">
                          {log.details || '—'}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-stone-400">
                          {new Date(log.createdAt).toLocaleString('ar-DZ')}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-stone-400 space-y-1">
              <CheckCircle2 className="w-8 h-8 text-indigo-400 mx-auto opacity-70" />
              <p>لا توجد سجلات تدقيق تطابق البحث حالياً.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: System Settings Form */}
      {rejectDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="clean-card w-full max-w-md p-6 space-y-4 bg-[#111D38] border border-rose-800/80 text-stone-100 shadow-2xl rounded-2xl relative">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <XCircle className="w-5 h-5 text-rose-400" />
              {rejectDialog.title}
            </h3>

            <form onSubmit={handleConfirmRejection} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-300">
                  سبب الرفض (سيتم إرساله للأستاذ في إشعار رسمي) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectDialog.reason}
                  onChange={(e) => setRejectDialog((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="اكتب سبب عدم قبول هذا الطلب (مثال: وصل التحويل غير واضح، أو المبلغ المدفوع غير مطابق...)"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={rejectDialog.isSubmitting}
                  onClick={() => setRejectDialog({ isOpen: false, type: null, id: null, title: '', reason: '', isSubmitting: false })}
                  className="border-slate-700 text-stone-300"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={rejectDialog.isSubmitting}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  تأكيد الرفض والإشعار
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
