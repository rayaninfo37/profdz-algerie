import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 — الصفحة غير موجودة | PROF DZ',
};

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-center px-4"
      dir="rtl"
    >
      <div className="max-w-lg">
        <div className="text-8xl font-bold text-sky-500 mb-4">404</div>
        <h1 className="text-3xl font-bold text-white mb-3">الصفحة غير موجودة</h1>
        <p className="text-gray-400 mb-8 text-lg">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها أو حذفها.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition-colors"
          >
            العودة إلى الرئيسية
          </Link>
          <Link
            href="/teachers"
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors"
          >
            تصفح الأساتذة
          </Link>
        </div>
      </div>
    </div>
  );
}

