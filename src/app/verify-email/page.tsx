'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setErrorMsg('رمز التحقق مفقود من الرابط.');
      return;
    }

    fetch('/api/auth/verify-email?token=' + encodeURIComponent(token))
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        if (data.success) {
          setSuccess(true);
        } else {
          setErrorMsg(data.error || 'فشل تأكيد البريد الإلكتروني.');
        }
      })
      .catch(() => {
        setLoading(false);
        setErrorMsg('حدث خطأ في الاتصال بالخادم.');
      });
  }, [token]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 text-stone-100" dir="rtl">
      <div className="clean-card w-full max-w-md p-8 bg-[#111D38] border border-[#1E3A5F] rounded-2xl shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-teal-500/40 text-teal-400 mx-auto flex items-center justify-center shadow-lg">
          <ShieldCheck className="w-9 h-9" />
        </div>

        <h1 className="text-2xl font-black text-white">تأكيد البريد الإلكتروني</h1>

        {loading && (
          <div className="py-8 space-y-3">
            <Loader2 className="w-10 h-10 animate-spin text-teal-400 mx-auto" />
            <p className="text-sm text-stone-300">جاري التحقق من صحة الرمز...</p>
          </div>
        )}

        {!loading && success && (
          <div className="py-4 space-y-4">
            <CheckCircle className="w-12 h-12 text-teal-400 mx-auto" />
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">تم التحقق بنجاح!</h2>
              <p className="text-xs text-stone-300 leading-relaxed">
                تم تأكيد عنوان بريدك الإلكتروني بنجاح. حسابك الآن موثوق بالكامل ويمكنك الاستفادة من كافة خدمات PROF DZ.
              </p>
            </div>
            <Link href="/login" className="block pt-2">
              <Button variant="primary" size="md" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold gap-2">
                المتابعة إلى تسجيل الدخول <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        )}

        {!loading && !success && (
          <div className="py-4 space-y-4">
            <XCircle className="w-12 h-12 text-rose-400 mx-auto" />
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">تعذر تأكيد البريد</h2>
              <p className="text-xs text-rose-300 leading-relaxed">
                {errorMsg || 'الرابط المستخدم غير صالح أو ربما انتهت صلاحيته.'}
              </p>
            </div>
            <Link href="/" className="block pt-2">
              <Button variant="outline" size="md" className="w-full border-slate-700 text-stone-200">
                العودة إلى الصفحة الرئيسية
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-stone-400">جاري التحميل...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}