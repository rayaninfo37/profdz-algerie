'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[KRYTY Error Boundary]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4" dir="rtl">
      <div className="max-w-lg">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-3xl font-bold text-white mb-3">حدث خطأ غير متوقع</h1>
        <p className="text-gray-400 mb-2 text-lg">
          عذراً، واجهنا خطأً تقنياً. يرجى المحاولة مرة أخرى.
        </p>
        {error.digest && (
          <p className="text-gray-600 text-xs mb-6">رمز الخطأ: {error.digest}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition-colors"
          >
            إعادة المحاولة
          </button>
          <a
            href="/"
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors"
          >
            العودة إلى الرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}

