'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { LogIn, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success) {
        switch (data.user.role) {
          case 'TEACHER':
            router.push('/dashboard/teacher');
            break;
          case 'STUDENT':
            router.push('/dashboard/student');
            break;
          case 'PARENT':
            router.push('/dashboard/parent');
            break;
          case 'ADMIN':
            router.push('/admin');
            break;
          default:
            router.push('/');
        }
        router.refresh();
      } else {
        setError(data.error || 'فشل في تسجيل الدخول. يرجى التحقق من البيانات المدخلة.');
      }
    } catch (err) {
      setError('حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 text-slate-100" dir="rtl">
      <div className="w-full max-w-md bg-[#0A1628]/90 p-8 sm:p-10 space-y-6 shadow-2xl border border-cyan-500/25 rounded-3xl backdrop-blur-xl">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 p-1 flex items-center justify-center mx-auto shadow-md shadow-cyan-500/10">
            <img src="/logok.png" alt="PROF DZ Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">تسجيل الدخول إلى PROF DZ</h2>
          <p className="text-xs text-slate-400 font-medium">ادخل بريدك الإلكتروني وكلمة المرور للمتابعة</p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-950/40 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">البريد الإلكتروني أو رقم الهاتف (Email or Phone)</label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@profdz.dz أو 0555123456"
              className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:bg-slate-900 transition-all shadow-inner"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">كلمة المرور (Password)</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:bg-slate-900 transition-all shadow-inner"
            />
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 font-bold text-white shadow-lg shadow-cyan-500/20 border-0"
            isLoading={loading}
            type="submit"
          >
            <LogIn className="w-4 h-4" /> دخول
          </Button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-4 border-t border-white/5">
          ليس لديك حساب؟{' '}
          <Link href="/register" className="text-cyan-400 font-bold hover:underline">
            أنشئ حساباً جديداً
          </Link>
        </div>
      </div>
    </div>
  );
}