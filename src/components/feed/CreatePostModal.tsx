'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { SUBJECTS, EDUCATION_LEVELS } from '@/lib/taxonomy';
import { Newspaper, Image as ImageIcon, Video, Upload, Send, X, CheckCircle, Sparkles } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
  currentUser?: any;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onPostCreated,
  currentUser: initialUser,
}) => {
  const toast = useToast();
  const [currentUser, setCurrentUser] = useState<any>(initialUser || null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('TIP');
  const [subject, setSubject] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isVideoMedia, setIsVideoMedia] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentUser) {
      fetch('/api/auth/me')
        .then((res) => res.json())
        .then((data) => {
          if (data.authenticated) setCurrentUser(data.user);
        })
        .catch(() => {});
    }
  }, [currentUser]);

  const isPro = currentUser?.teacherProfile?.subscriptionState === 'PRO_ACTIVE' || currentUser?.role === 'ADMIN';
  const charCount = content.length;
  const isOverLimit = charCount > 500;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isStudentOrParent = currentUser?.role === 'STUDENT' || currentUser?.role === 'PARENT';

    if (isVideo && isStudentOrParent) {
      setError('عذراً، نشر مقاطع الفيديو متاح للأساتذة المعتمدين فقط. يمكنك إرفاق صورة واحدة توضيحية.');
      return;
    }

    if (isVideo && !isPro) {
      setError('عذراً، نشر مقاطع الفيديو متاح للأساتذة المشتركين في باقة PRO. يمكنك إضافة صورة توضيحية.');
      return;
    }

    // Size check: 1MB for Student/Parent community posts, 20MB for Pro video, 3MB for Teacher image
    const maxBytes = isVideo ? 20 * 1024 * 1024 : (isStudentOrParent ? 1 * 1024 * 1024 : 3 * 1024 * 1024);
    if (file.size > maxBytes) {
      const maxMB = isVideo ? 20 : (isStudentOrParent ? 1 : 3);
      setError(`حجم الملف يتجاوز الحد الأقصى المسموح به (${maxMB} ميغابايت).`);
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'posts');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setMediaUrl(data.url);
        setIsVideoMedia(isVideo);
        toast.success(isVideo ? 'تم رفع مقطع الفيديو بنجاح.' : 'تم رفع الصورة بنجاح.');
      } else {
        setError(data.error || 'فشل تحميل الملف');
      }
    } catch (err) {
      setError('حدث خطأ أثناء تحميل الملف');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('محتوى المنشور التعليمي مطلوب.');
      return;
    }

    if (isOverLimit) {
      setError('لا يمكن نشر منشور يتجاوز 500 حرف. يرجى اختصار النص.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || null,
          content: content.trim(),
          postType,
          subject: subject || null,
          educationLevel: educationLevel || null,
          mediaUrl: mediaUrl.trim() || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('تم نشر المادة التعليمية بنجاح!');
        setTitle('');
        setContent('');
        setMediaUrl('');
        setIsVideoMedia(false);
        onClose();
        if (onPostCreated) onPostCreated();
        else window.location.reload();
      } else {
        setError(data.error || 'فشل في نشر المادة التعليمية.');
      }
    } catch (e: any) {
      setError('حدث خطأ أثناء الاتصال بالخادم.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="نشر منشور أو إرشاد تعليمي جديد (Create Educational Post)">
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0" dir="rtl">
        <div className="overflow-y-auto flex-1 min-h-0 px-1 space-y-4 text-stone-100 pb-2">
        {error && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl font-bold">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-bold text-teal-300">عنوان المنشور (اختياري)</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: ملخص درس المتتاليات العددية للبكالوريا"
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[11px] font-bold text-teal-300">نوع المنشور</label>
            <select
              value={postType}
              onChange={(e) => setPostType(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
            >
              <option value="TIP">نصيحة تعليمية (Tip)</option>
              <option value="STUDENT_QUESTION">سؤال واستفسار دراسي (Question)</option>
              <option value="TEACHER_REQUEST">طلب أستاذ / مساعدة (Teacher Request)</option>
              <option value="EXPLANATION">شرح درس (Explanation)</option>
              <option value="EXERCISE">تمرين للتفكير (Exercise)</option>
              <option value="STUDY_TIP">تجربة ومنهجية دراسية (Study Tip)</option>
              <option value="DISCUSSION">نقاش تعليمي (Discussion)</option>
              <option value="ANNOUNCEMENT">إعلان رسمي (Announcement)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-teal-300">المادة</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
            >
              <option value="">جميع المواد</option>
              {SUBJECTS.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-teal-300">المستوى</label>
            <select
              value={educationLevel}
              onChange={(e) => setEducationLevel(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
            >
              <option value="">جميع المستويات</option>
              {EDUCATION_LEVELS.map((l) => (
                <option key={l.id} value={l.label}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Post Content with 500 Character Limit Indicator */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-teal-300">محتوى المنشور التعليمي *</label>
            <span className={`text-[11px] font-mono ${isOverLimit ? 'text-rose-400 font-bold' : charCount > 450 ? 'text-amber-400' : 'text-stone-400'}`}>
              {charCount} / 500 حرف
            </span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            maxLength={520}
            placeholder="اكتب شرح الدرس، التمارين أو الملاحظات التعليمية هنا (الحد الأقصى 500 حرف)..."
            className={`w-full px-3.5 py-2.5 bg-slate-900 border rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none ${
              isOverLimit ? 'border-rose-500' : 'border-slate-700 focus:border-teal-500'
            }`}
          />
        </div>

        {/* Media Upload Section */}
        <div className="space-y-2 p-3.5 bg-slate-900/90 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
              {isPro ? <Video className="w-4 h-4 text-amber-400" /> : <ImageIcon className="w-4 h-4 text-teal-400" />}
              إرفاق وسائط (صورة أو فيديو للمحترفين)
            </label>
            {mediaUrl && (
              <span className="text-[11px] text-teal-400 font-normal flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> تم إرفاق الملف بنجاح
              </span>
            )}
          </div>

          <p className="text-[11px] text-stone-400 leading-relaxed">
            {isPro
              ? 'الحساب المحترف PRO: يمكنك إرفاق صورة (حتى 3 ميغابايت) أو مقطع فيديو توجيهي واحد يومياً (حتى 20 ميغابايت بصيغة MP4/WebM).'
              : 'الحساب المجاني: يُسمح بصورة واحدة فقط (JPG, PNG, WebP حتى 3 ميغابايت). نشر الفيديوهات مخصص لباقة PRO.'}
          </p>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept={isPro ? 'image/jpeg,image/png,image/webp,video/mp4,video/webm' : 'image/jpeg,image/png,image/webp'}
            className="hidden"
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="border-slate-700 text-stone-200 hover:bg-slate-800 gap-1.5"
            >
              <Upload className="w-4 h-4 text-teal-400" />
              {isPro ? 'اختر صورة أو فيديو (MP4/WebM)' : 'اختر صورة (JPG, PNG, WebP)'}
            </Button>

            {!isPro && (
              <span className="text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> الفيديو متاح لمشتركي PRO فقط
              </span>
            )}

            {mediaUrl && (
              <button
                type="button"
                onClick={() => {
                  setMediaUrl('');
                  setIsVideoMedia(false);
                }}
                className="p-1.5 text-stone-400 hover:text-rose-400 flex items-center gap-1 text-xs"
                title="إزالة الملف"
              >
                <X className="w-4 h-4" /> إزالة
              </button>
            )}
          </div>

          {mediaUrl && (
            <div className="pt-2">
              {isVideoMedia ? (
                <video src={mediaUrl} controls className="max-h-48 rounded-lg border border-slate-700" />
              ) : (
                <img src={mediaUrl} alt="Preview" className="max-h-48 rounded-lg border border-slate-700 object-cover" />
              )}
            </div>
          )}
        </div>
        </div>

        <div className="shrink-0 flex justify-end gap-2 pt-3 mt-2 border-t border-slate-800/80 bg-slate-950/95 sticky bottom-0 z-10 py-1">
          <Button variant="outline" size="sm" type="button" onClick={onClose} className="border-slate-700 text-stone-300">
            إلغاء
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            disabled={isOverLimit || isSubmitting}
            type="submit"
            className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> نشر في المنظومة
          </Button>
        </div>
      </form>
    </Modal>
  );
};
