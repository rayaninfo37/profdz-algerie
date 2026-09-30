'use client';

import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';

interface TeacherEditData {
  id: string;
  fullName: string;
  wilaya?: string | null;
  teacherProfile?: {
    id: string;
    phone?: string | null;
    whatsapp?: string | null;
    telegram?: string | null;
    website?: string | null;
    bio?: string | null;
    headline?: string | null;
    sheetsDestination?: string | null;
  } | null;
}

interface AdminEditTeacherModalProps {
  user: TeacherEditData;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminEditTeacherModal: React.FC<AdminEditTeacherModalProps> = ({
  user,
  onClose,
  onSuccess,
}) => {
  const toast = useToast();
  const [fullName, setFullName] = useState(user.fullName || '');
  const [wilaya, setWilaya] = useState(user.wilaya || '');
  const [phone, setPhone] = useState(user.teacherProfile?.phone || '');
  const [whatsapp, setWhatsapp] = useState(user.teacherProfile?.whatsapp || '');
  const [telegram, setTelegram] = useState(user.teacherProfile?.telegram || '');
  const [website, setWebsite] = useState(user.teacherProfile?.website || '');
  const [bio, setBio] = useState(user.teacherProfile?.bio || '');
  const [headline, setHeadline] = useState(user.teacherProfile?.headline || '');
  const [sheetsDestination, setSheetsDestination] = useState(user.teacherProfile?.sheetsDestination || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim() || undefined,
          wilaya: wilaya.trim() || null,
          phone: phone.trim() || null,
          whatsapp: whatsapp.trim() || null,
          telegram: telegram.trim() || null,
          website: website.trim() || null,
          bio: bio.trim() || null,
          headline: headline.trim() || null,
          sheetsDestination: sheetsDestination.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('تم تحديث بيانات المستخدم بنجاح.');
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'فشل التحديث.');
      }
    } catch {
      setError('خطأ في الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111D38] border border-[#1E3A5F] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl text-stone-100" dir="rtl">
        <div className="sticky top-0 bg-[#111D38] border-b border-slate-800 px-5 py-4 flex items-center justify-between z-10">
          <h3 className="font-bold text-white text-sm">تعديل بيانات: {user.fullName}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-950 border border-rose-800 text-rose-300 text-xs rounded-xl flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="text-xs font-bold text-stone-300">الاسم الكامل</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:border-teal-500 outline-none" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-stone-300">الولاية</label>
              <input value={wilaya} onChange={(e) => setWilaya(e.target.value)} maxLength={50}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:border-teal-500 outline-none" />
            </div>
          </div>

          {user.teacherProfile && (
            <>
              <hr className="border-slate-800" />
              <p className="text-[11px] text-teal-400 font-bold">بيانات الأستاذ</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-300">الهاتف</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0555000000"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:border-teal-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-300">واتساب</label>
                  <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="0555000000"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:border-teal-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-300">Telegram</label>
                  <input value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="@channel"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:border-teal-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-300">الموقع الإلكتروني</label>
                  <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:border-teal-500 outline-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-300">العنوان التعريفي (Headline)</label>
                <input value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={200}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:border-teal-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-300">نبذة (Bio)</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={1000}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:border-teal-500 outline-none resize-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-300">رابط جدول Google Sheets (اختياري)</label>
                <input value={sheetsDestination} onChange={(e) => setSheetsDestination(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:border-teal-500 outline-none" />
                <p className="text-[10px] text-stone-500">يُستخدم لتلقي طلبات الشراء مباشرة في جدول Google الخاص بالأستاذ.</p>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}
              className="border-slate-700 text-stone-300">إلغاء</Button>
            <Button type="submit" variant="primary" size="sm" isLoading={loading}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold gap-1.5">
              <Save className="w-3.5 h-3.5" /> حفظ التغييرات
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
