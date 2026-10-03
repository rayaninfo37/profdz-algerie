'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Users, GraduationCap, Heart, UserPlus, ShieldAlert, Camera, Check, ExternalLink, Building2 } from 'lucide-react';
import { WILAYAS } from '@/lib/taxonomy';
import { ProfessionalTitle, StudentType } from '@/types';
import { validateAlgerianPhone } from '@/lib/algerianPhone';
import { TermsPolicyModal } from '@/components/auth/TermsPolicyModal';

export const dynamic = 'force-dynamic';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams ? searchParams.get('role') || 'STUDENT' : 'STUDENT';

  const [role, setRole] = useState<string>(['TEACHER', 'STUDENT', 'PARENT'].includes(initialRole) ? initialRole : 'STUDENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [wilaya, setWilaya] = useState('الجزائر العاصمة (Algiers)');
  const [studentType, setStudentType] = useState<string>(StudentType.PUPIL_SECONDARY);
  const [professionalTitle, setProfessionalTitle] = useState<string>(ProfessionalTitle.PROFESSOR);
  const [headline, setHeadline] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('يرجى اختيار صورة صحيحة بصيغة JPG أو PNG.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('حجم الصورة الشخصية يجب ألا يتجاوز 2 ميغابايت.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const rawDataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const maxDim = 256;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setAvatarPreview(compressed);
          setAvatarUrl(compressed);
        } else {
          setAvatarPreview(rawDataUrl);
          setAvatarUrl(rawDataUrl);
        }
      };
      img.onerror = () => {
        setAvatarPreview(rawDataUrl);
        setAvatarUrl(rawDataUrl);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!termsAccepted) {
      setError('يرجى الموافقة على شروط الاستخدام وسياسة الخصوصية للمتابعة.');
      return;
    }

    if (!avatarUrl) {
      setError('يرجى تحديد صورة شخصية، فالصورة الشخصية مطلوبة لإنشاء الحساب.');
      return;
    }

    const phoneValidation = validateAlgerianPhone(phone, true);
    if (!phoneValidation.isValid) {
      setError(phoneValidation.error || 'يرجى إدخال رقم هاتف جزائري صحيح (10 أرقام).');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          fullName,
          phone,
          role,
          wilaya,
          termsAccepted,
          studentType: role === 'STUDENT' ? studentType : undefined,
          professionalTitle: role === 'TEACHER' ? professionalTitle : undefined,
          headline: role === 'TEACHER' ? headline : undefined,
          avatarUrl,
        }),
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
          default:
            router.push('/');
        }
        router.refresh();
      } else {
        setError(data.error || 'فشل في إنشاء الحساب. يرجى مراجعة البيانات المدخلة.');
      }
    } catch (err) {
      setError('حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  const rolesList = [
    { id: 'TEACHER', title: 'أستاذ (Teacher)', icon: Users, desc: 'نشر الدروس والملخصات وتلقي استفسارات الطلاب والأولياء مباشرة' },
    { id: 'STUDENT', title: 'تلميذ أو طالب (Student)', icon: GraduationCap, desc: 'اكتشاف الأساتذة المعتمدين، حفظ المواد والمكتبة التعليمية' },
    { id: 'PARENT', title: 'ولي أمر (Parent)', icon: Heart, desc: 'متابعة الأبناء واختيار أفضل الكفاءات التعليمية الموثوقة' },
  ];

  return (
    <>
      <TermsPolicyModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => setTermsAccepted(true)}
      />

      <div className="w-full max-w-2xl bg-[#0A1628]/90 p-8 sm:p-10 space-y-6 text-slate-100 border border-cyan-500/25 shadow-2xl rounded-3xl backdrop-blur-xl" dir="rtl">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 p-1 flex items-center justify-center mx-auto shadow-md shadow-cyan-500/10">
            <img src="/logok.png" alt="PROF DZ Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">انضم إلى منظومة PROF DZ</h2>
          <p className="text-xs text-slate-400 font-medium">اختر نوع حسابك لتخصيص تجربتك التعليمية بالكامل</p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-950/40 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            {error}
          </div>
        )}

        {/* Role Selector Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {rolesList.map((r) => {
            const Icon = r.icon;
            const isSelected = role === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-br from-cyan-950/80 to-teal-950/60 border-cyan-400 text-white shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-md shadow-cyan-400/50" />}
                </div>
                <div className="mt-3">
                  <h4 className="text-xs font-bold leading-tight text-white">{r.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">{r.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="space-y-4 pt-2">
          {/* Avatar Photo Selector */}
          <div className="p-4 bg-slate-900/60 border border-white/10 rounded-2xl flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-800 border-2 border-cyan-500/50 shrink-0 flex items-center justify-center relative shadow-sm">
              {avatarPreview ? (
                <img src={avatarPreview} alt="الصورة الشخصية" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-white block">
                الصورة الشخصية (مطلوبة لإنشاء الحساب) *
              </label>
              <p className="text-[11px] text-slate-400">
                أضف صورة شخصية واضحة. الصورة الشخصية مطلوبة لإنشاء الحساب.
              </p>
              <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors mt-1 shadow-sm">
                <Camera className="w-3.5 h-3.5" />
                تحديد صورة
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarSelect}
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">الاسم الكامل (Full Name) *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: ياسمين بلقاسم"
                className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:bg-slate-900 shadow-inner"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">البريد الإلكتروني (Email) *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yasmine@example.dz"
                className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:bg-slate-900 shadow-inner"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">كلمة المرور (Password) *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:bg-slate-900 shadow-inner"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">رقم الهاتف الجزائري (Phone) *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0550123456"
                className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:bg-slate-900 shadow-inner"
              />
              <span className="text-[10px] text-slate-500 block">10 أرقام تبدأ بـ 05 أو 06 أو 07</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">الولاية (Wilaya) *</label>
            <select
              value={wilaya}
              onChange={(e) => setWilaya(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400 focus:bg-slate-900 shadow-inner"
            >
              {WILAYAS.map((w) => (
                <option key={w.code} value={w.name} className="bg-slate-900 text-white">
                  {w.code} - {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Student Specific Sub-Type Selection */}
          {role === 'STUDENT' && (
            <div className="space-y-2 pt-2 border-t border-white/5">
              <label className="text-xs font-bold text-cyan-300 block">المرحلة الدراسية (Student Category) *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: StudentType.PUPIL_PRIMARY, label: 'ابتدائي (Primary)' },
                  { id: StudentType.PUPIL_MIDDLE, label: 'متوسط (Middle)' },
                  { id: StudentType.PUPIL_SECONDARY, label: 'ثانوي / BAC' },
                  { id: StudentType.UNIVERSITY, label: 'جامعي (University)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStudentType(item.id)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      studentType === item.id
                        ? 'bg-gradient-to-r from-teal-600 to-cyan-600 border-cyan-400 text-white shadow-md shadow-cyan-500/20'
                        : 'bg-slate-900/60 border-white/10 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Teacher Specific Fields */}
          {role === 'TEACHER' && (
            <div className="space-y-4 pt-2 border-t border-white/5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-cyan-300 block">اللقب والصفة المهنية (Title) *</label>
                  <select
                    value={professionalTitle}
                    onChange={(e) => setProfessionalTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400 focus:bg-slate-900 shadow-inner"
                  >
                    <option value={ProfessionalTitle.PROFESSOR} className="bg-slate-900 text-white">أستاذ (Professor / Teacher)</option>
                    <option value={ProfessionalTitle.DOCTOR} className="bg-slate-900 text-white">دكتور (Doctor / Ph.D.)</option>
                    <option value={ProfessionalTitle.ENGINEER} className="bg-slate-900 text-white">مهندس (Engineer)</option>
                    <option value={ProfessionalTitle.INSPECTOR} className="bg-slate-900 text-white">مفتش تربوي (Inspector)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-cyan-300 block">العنوان التعريفي (Headline)</label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="مثال: أستاذ مادة الرياضيات للطور الثانوي وتحضير البكالوريا"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:bg-slate-900 shadow-inner"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Mandatory Legal Terms & Privacy Consent Checkbox */}
          <div className="pt-3 border-t border-white/5">
            <div className="flex items-start gap-3 select-none">
              <button
                type="button"
                onClick={() => setTermsAccepted(!termsAccepted)}
                className={`w-5 h-5 rounded-lg border mt-0.5 shrink-0 flex items-center justify-center transition-colors ${
                  termsAccepted ? 'bg-cyan-500 border-cyan-500 text-black shadow-md shadow-cyan-500/30' : 'bg-slate-900 border-white/20 text-transparent'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs text-slate-400 leading-relaxed">
                أقر بأنني قرأت وأوافق على{' '}
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-cyan-400 font-bold hover:underline inline-flex items-center gap-0.5"
                >
                  شروط الاستخدام وسياسة الخصوصية
                  <ExternalLink className="w-3 h-3" />
                </button>{' '}
                الخاصة بمنصة PROF DZ.
              </span>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full pt-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold shadow-lg shadow-cyan-500/20 border-0"
            isLoading={loading}
            disabled={!termsAccepted || loading}
            type="submit"
          >
            إنشاء حساب جديد
          </Button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-3 border-t border-white/5">
          لديك حساب بالفعل؟{' '}
          <Link href="/login" className="text-cyan-400 font-bold hover:underline">
            تسجيل الدخول
          </Link>
        </div>
      </div>
    </>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-[90vh] py-12 px-4 flex items-center justify-center text-slate-100">
      <Suspense fallback={<div className="text-cyan-400 text-sm">جاري تحميل استمارة التسجيل...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
