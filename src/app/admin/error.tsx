'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[KRYTY Admin Error]', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4" dir="rtl">
      <div className="max-w-md w-full bg-[#0A1628]/90 border border-rose-500/20 rounded-2xl p-8 space-y-5 shadow-2xl">
        <div className="text-5xl">🛡️</div>
        <h1 className="text-xl font-black text-white">خطأ في لوحة الإدارة</h1>
        <p className="text-sm text-slate-400">
          حدث خطأ تقني في لوحة تحكم الإدارة. تأكد من صلاحياتك وحاول مرة أخرى.
        </p>
        {error.digest && (
          <p className="text-xs text-slate-600 font-mono">رمز الخطأ: {error.digest}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl transition-colors"
          >
            إعادة المحاولة
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl transition-colors"
          >
            الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
