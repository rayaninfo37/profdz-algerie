'use client';

import React, { useState } from 'react';
import { KeyRound, Phone, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/** Embedded Security Settings panel — drop anywhere in dashboard */
export const SecuritySettings: React.FC = () => {
  // Password change state
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [showPw, setShowPw] = useState(false);

  // Phone change state
  const [newPhone, setNewPhone] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [phoneSuccess, setPhoneSuccess] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (pwNew !== pwConfirm) {
      setPwError('كلمتا المرور الجديدة غير متطابقتين.');
      return;
    }
    if (pwNew.length < 8) {
      setPwError('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل.');
      return;
    }
    if (!/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwNew)) {
      setPwError('يجب أن تحتوي كلمة المرور الجديدة على رقم أو رمز خاص.');
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwCurrent, newPassword: pwNew }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPwSuccess('تم تغيير كلمة المرور بنجاح. تسجيل دخولك القادم سيستخدم الكلمة الجديدة.');
        setPwCurrent('');
        setPwNew('');
        setPwConfirm('');
      } else {
        setPwError(data.error || 'فشل تغيير كلمة المرور.');
      }
    } catch {
      setPwError('خطأ في الاتصال بالخادم.');
    } finally {
      setPwLoading(false);
    }
  };

  const handlePhoneChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');
    setPhoneSuccess('');
    if (!newPhone.trim()) {
      setPhoneError('يرجى إدخال رقم الهاتف الجديد.');
      return;
    }
    setPhoneLoading(true);
    try {
      const res = await fetch('/api/auth/change-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: newPhone.trim(), newPhone: newPhone.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPhoneSuccess('تم تحديث رقم الهاتف بنجاح.');
        setNewPhone('');
      } else {
        setPhoneError(data.error || 'فشل تحديث رقم الهاتف.');
      }
    } catch {
      setPhoneError('خطأ في الاتصال بالخادم.');
    } finally {
      setPhoneLoading(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Change Password */}
      <div className="clean-card p-5 bg-[#0D1B2E] border border-[#1E3A5F] rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-teal-400" />
          تغيير كلمة المرور
        </h3>

        {pwSuccess && (
          <div className="p-3 bg-teal-950/80 border border-teal-700 text-teal-300 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" /> {pwSuccess}
          </div>
        )}
        {pwError && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {pwError}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-300">كلمة المرور الحالية</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={pwCurrent}
                onChange={(e) => setPwCurrent(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-3.5 py-2.5 pr-9 bg-slate-900 border border-slate-700 rounded-xl text-sm sm:text-base text-white focus:border-teal-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute left-2.5 top-3 text-stone-400 hover:text-white"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-300">كلمة المرور الجديدة</label>
            <input
              type="password"
              value={pwNew}
              onChange={(e) => setPwNew(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="8 أحرف على الأقل، تتضمن رقماً أو رمزاً"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm sm:text-base text-white focus:border-teal-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-300">تأكيد كلمة المرور الجديدة</label>
            <input
              type="password"
              value={pwConfirm}
              onChange={(e) => setPwConfirm(e.target.value)}
              required
              autoComplete="new-password"
              className={`w-full px-3.5 py-2.5 bg-slate-900 border rounded-xl text-sm sm:text-base text-white focus:outline-none focus:border-teal-500 ${
                pwConfirm && pwNew !== pwConfirm ? 'border-rose-600' : 'border-slate-700'
              }`}
            />
            {pwConfirm && pwNew !== pwConfirm && (
              <p className="text-xs text-rose-400">كلمتا المرور غير متطابقتين</p>
            )}
          </div>
          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={pwLoading}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold h-9 px-4 text-xs"
            >
              تحديث كلمة المرور
            </Button>
          </div>
        </form>
      </div>

      {/* Change Phone */}
      <div className="clean-card p-5 bg-[#0D1B2E] border border-[#1E3A5F] rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Phone className="w-4 h-4 text-teal-400" />
          تغيير رقم الهاتف
        </h3>
        <p className="text-xs text-stone-400">
          تغيير رقم الهاتف يحدّث وسيلة تسجيل الدخول وتواصل الطلاب معك. يجب أن يبدأ بـ 05 أو 06 أو 07.
        </p>

        {phoneSuccess && (
          <div className="p-3 bg-teal-950/80 border border-teal-700 text-teal-300 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" /> {phoneSuccess}
          </div>
        )}
        {phoneError && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {phoneError}
          </div>
        )}

        <form onSubmit={handlePhoneChange} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-300">رقم الهاتف الجديد</label>
            <input
              type="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="0555 12 34 56"
              required
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm sm:text-base text-white font-mono focus:border-teal-500 outline-none"
            />
          </div>
          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={phoneLoading}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold h-9 px-4 text-xs"
            >
              تحديث رقم الهاتف
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
