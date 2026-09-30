'use client';

import React, { useState } from 'react';
import { ShoppingCart, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'tel' | 'number' | 'select' | 'textarea';
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

interface PurchaseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productTitle: string;
  priceDZD: number;
  isFree: boolean;
  /** JSON array of FormField — teacher-configured dynamic fields */
  purchaseFormSchema?: string;
}

// Standard fields — always present, always sent as top-level fields to API
const STANDARD_FIELDS: FormField[] = [
  { id: 'firstName', label: 'الاسم', type: 'text', required: true, placeholder: 'الاسم الأول' },
  { id: 'lastName',  label: 'اللقب', type: 'text', required: true, placeholder: 'اللقب' },
  { id: 'phone',     label: 'رقم الهاتف', type: 'tel', required: true, placeholder: '0555 XXX XXX' },
];

const STANDARD_IDS = new Set(['firstName', 'lastName', 'phone']);

function parseCustomSchema(raw?: string): FormField[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Filter out any custom fields that duplicate standard IDs
      return (parsed as FormField[]).filter(f => !STANDARD_IDS.has(f.id)).slice(0, 10);
    }
  } catch { /* ignore */ }
  return [];
}

export const PurchaseFormModal: React.FC<PurchaseFormModalProps> = ({
  isOpen,
  onClose,
  productId,
  productTitle,
  priceDZD,
  isFree,
  purchaseFormSchema,
}) => {
  const customSchema = parseCustomSchema(purchaseFormSchema);
  const allFields = [...STANDARD_FIELDS, ...customSchema];

  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleChange = (id: string, val: string) => {
    setValues((prev) => ({ ...prev, [id]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // prevent double-submit
    setError('');

    // Client-side required validation
    for (const field of allFields) {
      if (field.required && !values[field.id]?.trim()) {
        setError(`حقل "${field.label}" مطلوب.`);
        return;
      }
    }

    // Build custom fields map (excludes standard fields)
    const customFields: Record<string, string> = {};
    for (const field of customSchema) {
      if (values[field.id]?.trim()) {
        customFields[field.id] = values[field.id].trim();
      }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          firstName:  values['firstName']  || '',
          lastName:   values['lastName']   || '',
          phone:      values['phone']      || '',
          customFields,
          submissionToken: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
          _hp: '', // honeypot — must stay empty
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
      } else {
        setError(data.error || 'فشل إرسال الطلب. يرجى المحاولة مجدداً.');
      }
    } catch {
      setError('خطأ في الاتصال. يرجى التحقق من اتصالك بالإنترنت.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0D1527] border border-[#1E3A5F] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <h2 className="font-bold text-white flex items-center gap-2 text-sm">
              <ShoppingCart className="w-4 h-4 text-teal-400" />
              طلب الحصول على المنتج
            </h2>
            <p className="text-[11px] text-stone-400 mt-0.5 line-clamp-1">{productTitle}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Price badge */}
        <div className="px-5 pt-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
            isFree
              ? 'bg-teal-950 text-teal-300 border border-teal-700/40'
              : 'bg-sky-950 text-sky-200 border border-sky-700/40'
          }`}>
            {isFree ? 'مجاني' : `${priceDZD.toLocaleString('ar-DZ')} دج`}
          </span>
        </div>

        {success ? (
          <div className="p-6 text-center space-y-4">
            <CheckCircle className="w-14 h-14 text-teal-400 mx-auto" />
            <p className="text-white font-bold">تم إرسال طلبك بنجاح!</p>
            <p className="text-xs text-stone-400">سيتواصل معك الأستاذ قريباً على الرقم الذي أدخلته.</p>
            <Button variant="outline" size="sm" onClick={onClose} className="border-slate-700 text-stone-300">
              إغلاق
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            {/* Honeypot — hidden from real users */}
            <input type="text" name="_hp" className="hidden" tabIndex={-1} autoComplete="off"
              value={values['_hp'] || ''} onChange={(e) => handleChange('_hp', e.target.value)} />

            {allFields.map((field) => (
              <div key={field.id} className="space-y-1">
                <label className="text-xs font-bold text-stone-300">
                  {field.label}{field.required && <span className="text-rose-400 mr-0.5">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    rows={3}
                    required={field.required}
                    value={values[field.id] || ''}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:border-teal-500 outline-none resize-none"
                  />
                ) : field.type === 'select' && field.options ? (
                  <select
                    required={field.required}
                    value={values[field.id] || ''}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:border-teal-500 outline-none"
                  >
                    <option value="">اختر...</option>
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    required={field.required}
                    value={values[field.id] || ''}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:border-teal-500 outline-none"
                  />
                )}
              </div>
            ))}

            <p className="text-[10px] text-stone-500 leading-relaxed">
              بياناتك محفوظة بأمان ولن تُشارك مع أي طرف ثالث.
            </p>

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}
                className="flex-1 border-slate-700 text-stone-300">
                إلغاء
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={loading}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold">
                <ShoppingCart className="w-4 h-4" /> إرسال الطلب
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
