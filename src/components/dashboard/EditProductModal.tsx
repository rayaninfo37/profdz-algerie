'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { BookOpen, AlertCircle, Youtube, Trash2, Eye, EyeOff, Save, Check } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { SUBJECT_NAMES } from '@/lib/taxonomy';
import { KRYTY_CONFIG } from '@/lib/config';

export interface EditableProduct {
  id: string;
  title: string;
  description: string;
  subject: string;
  educationLevel?: string;
  educationTargets?: string | string[] | null;
  productType: string;
  priceDZD: number;
  isFree: boolean;
  previewContent?: string | null;
  coverImage?: string | null;
  youtubeUrl?: string | null;
  isPublished: boolean;
  slug?: string;
}

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: EditableProduct;
  onSuccess?: (updatedProduct: any) => void;
  onDelete?: (deletedProductId: string) => void;
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
const YT_PATTERN = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/|^)([a-zA-Z0-9_-]{11})/;

export const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  onClose,
  product,
  onSuccess,
  onDelete,
}) => {
  const toast = useToast();
  const [title, setTitle] = useState(product.title || '');
  const [description, setDescription] = useState(product.description || '');
  const [subject, setSubject] = useState(product.subject || SUBJECT_NAMES[0]);
  const [productType, setProductType] = useState(product.productType || 'BOOK');
  const [educationLevel, setEducationLevel] = useState(product.educationLevel || 'SECONDARY');

  const parseInitialTargets = (): string[] => {
    if (Array.isArray(product.educationTargets)) return product.educationTargets;
    if (typeof product.educationTargets === 'string') {
      try {
        const parsed = JSON.parse(product.educationTargets);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return [];
      }
    }
    return [];
  };

  const [educationTargets, setEducationTargets] = useState<string[]>(parseInitialTargets());
  const [priceDZD, setPriceDZD] = useState(product.priceDZD !== undefined ? String(product.priceDZD) : '0');
  const [isFree, setIsFree] = useState(Boolean(product.isFree));
  const [previewContent, setPreviewContent] = useState(product.previewContent || '');
  const [youtubeUrl, setYoutubeUrl] = useState(product.youtubeUrl || '');
  const [isPublished, setIsPublished] = useState(Boolean(product.isPublished));
  const [coverImage, setCoverImage] = useState(product.coverImage || '');
  const [newCoverFile, setNewCoverFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState('');
  const [youtubeError, setYoutubeError] = useState('');

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !description.trim()) {
      setError('يرجى ملء عنوان المورد والوصف التعليمي.');
      return;
    }
    if (title.trim().length > MAX_TITLE) {
      setError(`العنوان لا يمكن أن يتجاوز ${MAX_TITLE} حرفاً.`);
      return;
    }
    if (description.trim().length > MAX_DESC) {
      setError(`الوصف لا يمكن أن يتجاوز ${MAX_DESC} حرفاً.`);
      return;
    }
    if (!isFree && (!priceDZD || parseFloat(priceDZD) < 0)) {
      setError('يرجى إدخال سعر صحيح أو تحديد المنتج كمجاني.');
      return;
    }
    const ytErr = validateYouTube(youtubeUrl);
    if (ytErr) {
      setYoutubeError(ytErr);
      return;
    }

    setLoading(true);

    try {
      let finalCover = coverImage;
      if (newCoverFile) {
        const coverData = new FormData();
        coverData.append('file', newCoverFile);
        coverData.append('category', 'product-cover');
        const upRes = await fetch('/api/upload', { method: 'POST', body: coverData });
        const upJson = await upRes.json();
        if (upRes.ok && upJson.success && upJson.url) {
          finalCover = upJson.url;
        } else {
          setError(upJson.error || 'فشل في رفع صورة الغلاف الجديدة.');
          setLoading(false);
          return;
        }
      }

      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          subject,
          educationLevel,
          educationTargets,
          productType,
          priceDZD: isFree ? 0 : parseFloat(priceDZD) || 0,
          isFree,
          coverImage: finalCover || undefined,
          previewContent: previewContent.trim(),
          youtubeUrl: youtubeUrl.trim() || '',
          isPublished,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.product) {
        toast.success('تم حفظ تعديلات المنتج بنجاح!');
        if (onSuccess) onSuccess(data.product);
        onClose();
      } else {
        setError(data.error || 'فشل في تعديل المورد التعليمي.');
      }
    } catch {
      setError('حدث خطأ أثناء الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError('');

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('تم حذف المورد التعليمي نهائياً.');
        if (onDelete) onDelete(product.id);
        onClose();
      } else {
        setError(data.error || 'فشل في حذف المنتج.');
      }
    } catch {
      setError('حدث خطأ أثناء محاولة حذف المنتج.');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-hidden">
      <div
        className="bg-[#0D1527] border border-[#1E3A5F] rounded-2xl w-full max-w-2xl max-h-[88vh] sm:max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-stone-100"
        dir="rtl"
      >
        {/* Header (shrink-0) */}
        <div className="shrink-0 bg-[#0D1527] border-b border-[#1E3A5F] px-5 sm:px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-teal-400" />
            <h2 className="text-base font-bold text-white">تعديل المورد: {product.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors text-xl leading-none"
            aria-label="إغلاق"
          >
            ×
          </button>
        </div>

        {/* Scrollable Form Body (flex-1 min-h-0) */}
        <form id="edit-product-form" onSubmit={handleSave} className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-4 space-y-4 overscroll-contain">
          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* Delete Confirmation Box */}
          {showDeleteConfirm && (
            <div className="p-4 bg-rose-950/90 border border-rose-700 text-white text-xs rounded-xl space-y-3">
              <p className="font-bold">هل أنت متأكد من رغبتك في حذف هذا المنتج التعليمي؟</p>
              <p className="text-rose-200 text-[11px]">
                سيتم حذف المورد وكافة الملفات والتقييمات والروابط المرتبطة به ولا يمكن التراجع عن هذا الإجراء.
              </p>
              <div className="flex gap-2 justify-end pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="border-slate-700 text-stone-300"
                >
                  إلغاء
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleDelete}
                  isLoading={deleting}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  نعم، احذف نهائياً
                </Button>
              </div>
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
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:border-teal-500 outline-none"
            />
          </div>

          {/* Type & Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-300">نوع المورد</label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:border-teal-500 outline-none"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-300">المادة الدراسية</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:border-teal-500 outline-none"
              >
                {SUBJECT_NAMES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    educationTargets.includes(opt.value)
                      ? 'bg-teal-600 border-teal-500 text-white'
                      : 'bg-slate-900 border-slate-700 text-stone-400 hover:border-slate-500'
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
              <label className="text-xs font-bold text-stone-300">الوصف والتفاصيل *</label>
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
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:border-teal-500 outline-none resize-none"
            />
          </div>

          {/* Pricing & Visibility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-900/50 rounded-xl border border-slate-800">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-300">السعر (دج DZD)</label>
              <input
                type="number"
                min="0"
                step="50"
                disabled={isFree}
                value={isFree ? '0' : priceDZD}
                onChange={(e) => setPriceDZD(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:border-teal-500 outline-none disabled:opacity-50"
              />
              <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs text-stone-300">
                <input
                  type="checkbox"
                  checked={isFree}
                  onChange={(e) => {
                    setIsFree(e.target.checked);
                    if (e.target.checked) setPriceDZD('0');
                  }}
                  className="rounded border-slate-700 text-teal-600 focus:ring-0"
                />
                <span>مورد مجاني (Free Download)</span>
              </label>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-300">حالة النشر والظهور</label>
              <button
                type="button"
                onClick={() => setIsPublished(!isPublished)}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                  isPublished
                    ? 'bg-teal-950/80 border-teal-600 text-teal-300'
                    : 'bg-slate-900 border-amber-700/60 text-amber-300'
                }`}
              >
                {isPublished ? (
                  <>
                    <Eye className="w-4 h-4 text-teal-400" />
                    <span>منشور في المتجر التعليمي</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4 text-amber-400" />
                    <span>مسودة (مخفي عن الزوار)</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-stone-400 pt-1">
                {isPublished
                  ? 'يظهر المورد حالياً لجميع الزوار في كتالوج المنتجات.'
                  : 'المورد محفوظ في حسابك فقط ولن يظهر للجمهور.'}
              </p>
            </div>
          </div>

          {/* YouTube Video URL */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
              <Youtube className="w-4 h-4 text-red-400" />
              رابط يوتيوب توضيحي (اختياري)
            </label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => {
                setYoutubeUrl(e.target.value);
                setYoutubeError(validateYouTube(e.target.value) || '');
              }}
              placeholder="https://www.youtube.com/watch?v=..."
              className={`w-full px-3.5 py-2.5 bg-slate-900 border rounded-xl text-xs text-white outline-none focus:border-teal-500 ${
                youtubeError ? 'border-rose-600' : 'border-slate-700'
              }`}
            />
            {youtubeError && <p className="text-[11px] text-rose-400">{youtubeError}</p>}
          </div>

          {/* Preview Content */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-300">مقتطف المعاينة المجاني (اختياري)</label>
            <textarea
              rows={2}
              value={previewContent}
              onChange={(e) => setPreviewContent(e.target.value)}
              placeholder="اكتب نبذة أو عينة يراها الطالب لتذوق جودة المنتج قبل التواصل..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:border-teal-500 outline-none"
            />
          </div>

          {/* Change Cover Image */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-300">صورة الغلاف (تغيير أو تحديث)</label>
            {coverImage && !newCoverFile && (
              <div className="flex items-center gap-3 p-2 bg-slate-900/60 rounded-xl border border-slate-800">
                <img src={coverImage} alt="Cover preview" className="w-12 h-12 object-cover rounded-lg border border-slate-700" />
                <span className="text-xs text-stone-300 truncate flex-1">الغلاف الحالي</span>
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setNewCoverFile(f);
              }}
              className="w-full text-xs text-stone-300 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-teal-700 file:text-white hover:file:bg-teal-600"
            />
          </div>
        </form>

        {/* Dedicated Footer (shrink-0) - ALWAYS REACHABLE, NEVER OUT OF VIEW */}
        <div className="shrink-0 bg-[#0A1120] px-5 sm:px-6 py-3 border-t border-[#1E3A5F] flex items-center justify-between gap-3 z-10 shadow-lg">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="border-rose-800 text-rose-300 hover:bg-rose-950 gap-1.5 text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            حذف المورد
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
              className="border-slate-700 text-stone-300 text-xs"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              form="edit-product-form"
              variant="primary"
              size="sm"
              isLoading={loading}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold gap-1.5 text-xs"
            >
              <Save className="w-3.5 h-3.5" />
              حفظ التعديلات
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
