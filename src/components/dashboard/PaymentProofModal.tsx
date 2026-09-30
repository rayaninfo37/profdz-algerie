'use client';

import React, { useState, useEffect } from 'react';
import { X, Upload, CheckCircle2, ShieldCheck, AlertCircle, FileText, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';

interface PaymentProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PaymentProofModal: React.FC<PaymentProofModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState<{
    ccpAccount: string;
    ccpKey: string;
    baridiMobRip: string;
    accountHolderName: string;
    proPriceDZD: number;
  }>({
    ccpAccount: '',
    ccpKey: '',
    baridiMobRip: '',
    accountHolderName: '',
    proPriceDZD: 2800,
  });
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/settings/payment')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.paymentSettings) {
            setSettings(data.paymentSettings);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingSettings(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('يرجى اختيار صورة الوصل أو ملف PDF للإثبات.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // 1. Upload private receipt document
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'receipts');
      formData.append('isPrivate', 'true');

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.success) {
        throw new Error(uploadData.error || 'فشل في رفع ملف الوصل.');
      }

      // 2. Submit payment proof to subscription upgrade endpoint
      const upgradeRes = await fetch('/api/teachers/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptUrl: uploadData.storagePath || uploadData.documentUrl,
          transactionRef: transactionRef.trim() || undefined,
        }),
      });

      const upgradeData = await upgradeRes.json();
      if (!upgradeRes.ok || !upgradeData.success) {
        throw new Error(upgradeData.error || 'فشل في تسجيل طلب الترقية.');
      }

      toast.success('تم إرسال وصل التحويل بنجاح! سيتم تدقيقه وتفعيل باقة PRO خلال ساعات قليلة.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء المعالجة.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn" dir="rtl">
      <div className="clean-card w-full max-w-lg p-6 space-y-6 bg-[#111D38] border border-[#1E3A5F] text-stone-100 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-stone-400 hover:text-white p-1 rounded-lg transition-colors"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" /> ترقية معتمدة ومضمونة
          </div>
          <h2 className="text-xl font-black text-white">ترقية الحساب إلى أستاذ محترف (PRO)</h2>
          <p className="text-xs text-stone-300">
            وصول غير محدود لملفك الشخصي، نشر فيديوهات توجيهية، وظهور مميز في الترتيب.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Official Algeria Payment Details Card */}
        <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-700/80 space-y-3">
          <div className="flex items-center gap-2 text-teal-400 text-xs font-bold">
            <Landmark className="w-4 h-4" /> بيانات التحويل المعتمدة (CCP / BaridiMob):
          </div>

          {loadingSettings ? (
            <div className="p-4 text-center text-xs text-stone-400 animate-pulse">
              جاري تحميل بيانات الدفع الرسمية...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-stone-400 block">رقم الحساب البريدي (CCP):</span>
                  <strong className="text-white text-sm tracking-wider font-mono">
                    {settings.ccpAccount ? `${settings.ccpAccount}${settings.ccpKey ? ' / ' + settings.ccpKey : ''}` : 'قيد التحديث من الإدارة'}
                  </strong>
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-stone-400 block">المبلغ المطلوب (30 يوماً):</span>
                  <strong className="text-amber-400 text-sm font-bold">
                    {settings.proPriceDZD.toLocaleString()} دج (DZD)
                  </strong>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <span className="text-[10px] text-stone-400 block">حساب بريدي موب (RIP BaridiMob):</span>
                <strong className="text-teal-300 font-mono text-[11px] block mt-0.5">
                  {settings.baridiMobRip || 'قيد التحديث من الإدارة'}
                </strong>
                <span className="text-[10px] text-stone-400 block mt-1">
                  المستفيد: {settings.accountHolderName || 'PROF DZ'}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-teal-300">
              وصل التحويل أو الإشعار (صورة الوصل أو ملف PDF) *
            </label>
            <div className="relative border-2 border-dashed border-slate-700 hover:border-teal-500 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-slate-900/60">
              <input
                type="file"
                required
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFile(e.target.files[0]);
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-6 h-6 text-teal-400" />
                <span className="text-xs font-semibold text-stone-200">
                  {file ? file.name : 'انقر لاختيار ملف الوصل أو اسحبه هنا'}
                </span>
                <span className="text-[10px] text-stone-400">
                  الحد الأقصى 5 ميغابايت (JPG, PNG, PDF)
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-300">
              رقم المعاملة أو ملاحظة إضافية (اختياري)
            </label>
            <input
              type="text"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="مثال: رقم الحوالة أو اسم المرسل"
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <Button
              variant="primary"
              size="md"
              type="submit"
              isLoading={uploading}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              إرسال الوصل للمراجعة والتفعيل
            </Button>
            <Button
              variant="outline"
              size="md"
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="border-slate-700 text-stone-300"
            >
              إلغاء
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
