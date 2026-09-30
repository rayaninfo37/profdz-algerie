'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { BookOpen, Upload, AlertCircle, Youtube } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { SUBJECT_NAMES } from '@/lib/taxonomy';
import { KRYTY_CONFIG } from '@/lib/config';
import { validateGoogleSheetUrl } from '@/lib/googleSheets';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const TYPE_OPTIONS = [
  { value: 'BOOK', label: 'كتاب أو ملخص' },
  { value: 'EXAM_PACK', label: 'بنك سلاسل وتمارين' },
  { value: 'EXERCISE_SHEET', label: 'ملخص دروس مكثف' },
  { value: 'BUNDLE', label: 'حقيبة تعليمية متكاملة' },
];

const EDUCATION_TARGET_OPTIONS = [
  { value: 'PRIMARY', label: 'ابتدائي' },
  { value: 'MIDDLE', label: 'متوسط' },
  { value: 'SECONDARY', label: 'ثانوي' },
  { value: '3AS', label: '3AS / بكالوريا' },
  { value: 'UNIVERSITY', label: 'جامعي' },
  { value: 'ALL', label: 'للجميع' },
];

const MAX_DESC = KRYTY_CONFIG.productLimits?.maxDescriptionChars ?? 5000;
const MAX_TITLE = KRYTY_CONFIG.productLimits?.maxTitleChars ?? 200;
const MAX_COVER_MB = Math.round((KRYTY_CONFIG.productMedia?.maxCoverSizeBytes ?? 10485760) / 1024 / 1024);
const MAX_GALLERY = KRYTY_CONFIG.productMedia?.maxGalleryImageCount ?? 6;

const YT_PATTERN = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/|^)([a-zA-Z0-9_-]{11})/;

export const CreateProductModal: React.FC<CreateProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState(SUBJECT_NAMES[0]);
  const [educationTargets, setEducationTargets] = useState<string[]>([]);
  const [productType, setProductType] = useState('BOOK');
  const [priceDZD, setPriceDZD] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeError, setYoutubeError] = useState('');
  const [sheetsWebhookUrl, setSheetsWebhookUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const toggleTarget = (val: string) => {
    setEducationTargets((prev) =>
      prev.includes(val) ? prev.filter((t) => t !== val) : [...prev, val]
    );
  };

  const validateYouTube = (url: string): string | null => {
    if (!url.trim()) return null;
    const m = url.match(YT_PATTERN);
    if (!m) return 'رابط يوتيوب غير صالح. استخدم رابط youtube.com أو youtu.be.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !description.trim()) {
      setError('يرجى كتابة عنوان المورد ووصفه التعليمي.');
      return;
    }
    if (title.trim().length > MAX_TITLE) {
      setError(`العنوان يجب ألا يتجاوز ${MAX_TITLE} حرفاً.`);
      return;
    }
    if (description.trim().length > MAX_DESC) {
      setError(`الوصف يجب ألا يتجاوز ${MAX_DESC} حرفاً.`);
      return;
    }
    if (!isFree && (!priceDZD || parseFloat(priceDZD) < 0)) {
      setError('يرجى إدخال سعر صحيح أو تحديد "مجاني".');
      return;
    }
    const ytErr = validateYouTube(youtubeUrl);
    if (ytErr) {
      setYoutubeError(ytErr);
      return;
    }
    if (sheetsWebhookUrl.trim()) {
      const sheetVal = validateGoogleSheetUrl(sheetsWebhookUrl.trim());
      if (!sheetVal.isValid) {
        setError(sheetVal.error || 'رابط Google Sheet غير صالح.');
        return;
      }
    }

    setLoading(true);

    try {
      // 1. Upload Cover
      let uploadedCoverUrl = '';
      let uploadedCoverSize = 0;
      if (coverFile) {
        const coverData = new FormData();
        coverData.append('file', coverFile);
        coverData.append('category', 'product-cover');
        const upRes = await fetch('/api/upload', { method: 'POST', body: coverData });
        const upJson = await upRes.json();
        if (!upRes.ok || !upJson.success) {
          setError(upJson.error || 'فشل في رفع صورة الغلاف.');
          return;
        }
        uploadedCoverUrl = upJson.url;
        uploadedCoverSize = coverFile.size;
      }

      // 2. Upload Gallery
      const uploadedGallery: Array<{ fileUrl: string; fileSizeBytes: number; title: string }> = [];
      for (let i = 0; i < galleryFiles.length; i++) {
        const gf = galleryFiles[i];
        const gData = new FormData();
        gData.append('file', gf);
        gData.append('category', 'product-gallery');
        const upRes = await fetch('/api/upload', { method: 'POST', body: gData });
        const upJson = await upRes.json();
        if (!upRes.ok || !upJson.success) {
          setError(upJson.error || `فشل في رفع صورة رقم ${i + 1}.`);
          return;
        }
        uploadedGallery.push({ fileUrl: upJson.url, fileSizeBytes: gf.size, title: `صورة ${i + 1}` });
      }

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          subject,
          educationTargets,
          productType,
          priceDZD: isFree ? 0 : parseFloat(priceDZD || '0'),
          isFree,
          previewContent: previewContent.trim() || undefined,
          coverImage: uploadedCoverUrl,
          coverSizeBytes: uploadedCoverSize,
          galleryImages: uploadedGallery,
          youtubeUrl: youtubeUrl.trim() || undefined,
          sheetsWebhookUrl: sheetsWebhookUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('تمت إضافة المنتج التعليمي بنجاح!');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(data.error || 'فشل في حفظ المنتج التعليمي.');
      }
    } catch {
      setError('حدث خطأ أثناء الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0D1527] border border-[#1E3A5F] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-[#0D1527] border-b border-[#1E3A5F] px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-400" />
            إضافة منتج تعليمي جديد
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5" dir="rtl">
          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-stone-300">عنوان المورد أو الكتاب *</label>
              <span className={`text-[10px] ${title.length > MAX_TITLE * 0.9 ? 'text-rose-400' : 'text-stone-500'}`}>
                {title.length}/{MAX_TITLE}
              </span>
            </div>
            <input
              type="text"
              required
              maxLength={MAX_TITLE}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: الحقيبة الشاملة في الرياضيات — بكالوريا 2026"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:border-teal-500 outline-none"
            />
          </div>

          {/* Type & Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-300">نوع المورد</label>
              <select value={productType} onChange={(e) => setProductType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:border-teal-500 outline-none">
                {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-300">المادة الدراسية</label>
              <select value={subject} onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:border-teal-500 outline-none">
                {SUBJECT_NAMES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Education Targets */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-300">الأطوار التعليمية المستهدفة</label>
            <div className="flex flex-wrap gap-2">
              {EDUCATION_TARGET_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleTarget(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    educationTargets.includes(opt.value)
                      ? 'bg-teal-700 border-teal-500 text-white'
                      : 'bg-slate-900 border-slate-700 text-stone-300 hover:border-teal-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-stone-300">وصف المحتوى التعليمي *</label>
              <span className={`text-[10px] ${description.length > MAX_DESC * 0.9 ? 'text-rose-400' : 'text-stone-500'}`}>
                {description.length}/{MAX_DESC}
              </span>
            </div>
            <textarea
              required
              rows={4}
              maxLength={MAX_DESC}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اشرح ما يتضمنه: الفصول، التمارين، الحلول النموذجية، مستوى الصعوبة..."
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:border-teal-500 outline-none resize-y"
            />
          </div>

          {/* Price */}
          <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-teal-300">السعر (دج)</label>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-300">
                <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 text-teal-600 focus:ring-0" />
                <span>مجاني</span>
              </label>
            </div>
            {!isFree ? (
              <input
                type="number"
                min="0"
                step="50"
                value={priceDZD}
                onChange={(e) => setPriceDZD(e.target.value)}
                placeholder="مثال: 1500"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-teal-500 outline-none"
              />
            ) : (
              <p className="text-[11px] text-teal-400 font-semibold">سيظهر المورد مجانياً للطلاب.</p>
            )}
          </div>

          {/* Cover Image */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-300">
              صورة الغلاف (حد أقصى {MAX_COVER_MB} ميغابايت)
            </label>
            {coverPreview && (
              <img src={coverPreview} alt="preview" className="w-24 h-24 object-cover rounded-xl border border-slate-700 mb-1" />
            )}
            <input type="file" accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                const maxBytes = KRYTY_CONFIG.productMedia?.maxCoverSizeBytes ?? 10485760;
                if (file && file.size > maxBytes) {
                  setError(`حجم صورة الغلاف يجب ألا يتجاوز ${MAX_COVER_MB} ميغابايت.`);
                  setCoverFile(null);
                  setCoverPreview('');
                } else {
                  setError('');
                  setCoverFile(file);
                  setCoverPreview(file ? URL.createObjectURL(file) : '');
                }
              }}
              className="w-full text-xs text-stone-300 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-teal-700 file:text-white hover:file:bg-teal-600"
            />
          </div>

          {/* Gallery */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-300">
              صور المعاينة (حتى {MAX_GALLERY} صور، {MAX_COVER_MB} ميغابايت لكل صورة)
            </label>
            <input type="file" accept="image/*" multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                const maxBytes = KRYTY_CONFIG.productMedia?.maxCoverSizeBytes ?? 10485760;
                if (files.length > MAX_GALLERY) {
                  setError(`عدد صور المعاينة لا يمكن أن يزيد عن ${MAX_GALLERY} صور.`);
                  setGalleryFiles([]);
                } else {
                  const oversized = files.find((f) => f.size > maxBytes);
                  if (oversized) {
                    setError(`الصورة "${oversized.name}" أكبر من ${MAX_COVER_MB} ميغابايت.`);
                    setGalleryFiles([]);
                  } else {
                    setError('');
                    setGalleryFiles(files);
                  }
                }
              }}
              className="w-full text-xs text-stone-300 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-teal-700 file:text-white hover:file:bg-teal-600"
            />
            {galleryFiles.length > 0 && (
              <p className="text-[10px] text-teal-400">{galleryFiles.length} صورة محددة</p>
            )}
          </div>

          {/* YouTube URL */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
              <Youtube className="w-3.5 h-3.5 text-red-400" />
              رابط يوتيوب (اختياري)
            </label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => {
                setYoutubeUrl(e.target.value);
                setYoutubeError(validateYouTube(e.target.value) || '');
              }}
              placeholder="https://www.youtube.com/watch?v=..."
              className={`w-full px-3.5 py-2.5 bg-slate-900 border rounded-xl text-xs text-white outline-none focus:border-teal-500 ${youtubeError ? 'border-rose-600' : 'border-slate-700'}`}
            />
            {youtubeError && <p className="text-[11px] text-rose-400">{youtubeError}</p>}
          </div>

          {/* Google Sheets Destination URL */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-300">
              جدول Google Sheets لتلقي طلبات هذا المنتج (اختياري)
            </label>
            <input
              type="url"
              value={sheetsWebhookUrl}
              onChange={(e) => setSheetsWebhookUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/.../edit"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-teal-500 font-mono placeholder-stone-500"
            />
            <p className="text-[10px] text-stone-400">
              الصق رابط جدول Google لتصلك الطلبات مباشرة فيه، أو اتركه فارغاً لاستخدام الجدول العام لملفك الشخصي.
            </p>
          </div>

          {/* Preview Content */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-300">مقتطف معاينة مجاني (اختياري)</label>
            <textarea
              rows={2}
              value={previewContent}
              onChange={(e) => setPreviewContent(e.target.value)}
              placeholder="اكتب نبذة تجريبية يراها الطالب قبل الشراء..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:border-teal-500 outline-none"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={loading}
              className="border-slate-700 text-stone-300">
              إلغاء
            </Button>
            <Button variant="primary" size="md" type="submit" isLoading={loading}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold gap-2">
              <BookOpen className="w-4 h-4" /> حفظ ونشر
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
