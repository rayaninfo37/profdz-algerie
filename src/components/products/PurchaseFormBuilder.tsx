'use client';

import React, { useState, useCallback } from 'react';
import { Plus, Trash2, GripVertical, Save, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { validateGoogleSheetUrl } from '@/lib/googleSheets';

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'tel' | 'number' | 'select' | 'textarea';
  required: boolean;
  placeholder?: string;
  options?: string; // comma-separated for select
}

const BASE_FIELDS: FormField[] = [
  { id: 'buyerName', label: 'الاسم', type: 'text', required: true, placeholder: 'الاسم الأول' },
  { id: 'buyerLastName', label: 'اللقب', type: 'text', required: true, placeholder: 'اللقب' },
  { id: 'buyerPhone', label: 'رقم الهاتف', type: 'tel', required: true, placeholder: '0555 XXX XXX' },
];

const TYPE_LABELS: Record<string, string> = {
  text: 'نص',
  tel: 'هاتف',
  number: 'رقم',
  select: 'قائمة اختيار',
  textarea: 'ملاحظات (نص طويل)',
};

const PRESETS = [
  { label: 'CCP', id: 'ccp', type: 'text', placeholder: 'رقم CCP' },
  { label: 'الولاية', id: 'wilaya', type: 'select', options: 'الجزائر,وهران,قسنطينة,عنابة,بجاية,سطيف,تلمسان,باتنة,بسكرة,تيزي وزو,أخرى' },
  { label: 'العنوان الكامل', id: 'address', type: 'text', placeholder: 'الحي، الشارع، المدينة' },
  { label: 'شركة التوصيل', id: 'deliveryCompany', type: 'select', options: 'Yalidine,Zaki,Maystro,Procolis,Guepard,أخرى' },
  { label: 'ملاحظات', id: 'notes', type: 'textarea', placeholder: 'أي ملاحظة إضافية...' },
];

interface PurchaseFormBuilderProps {
  productId: string;
  initialSchema?: string; // JSON string
  sheetsWebhookUrl?: string;
  onSaved?: () => void;
}

function newField(): FormField {
  return {
    id: `field_${Date.now()}`,
    label: '',
    type: 'text',
    required: false,
    placeholder: '',
    options: '',
  };
}

export const PurchaseFormBuilder: React.FC<PurchaseFormBuilderProps> = ({
  productId,
  initialSchema,
  sheetsWebhookUrl: initialWebhook,
  onSaved,
}) => {
  const toast = useToast();
  const [fields, setFields] = useState<FormField[]>(() => {
    try {
      const parsed = JSON.parse(initialSchema || '[]');
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [];
    } catch {
      return [];
    }
  });
  const [webhook, setWebhook] = useState(initialWebhook || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState<string | null>(null);

  const MAX_FIELDS = 15;

  const addField = (preset?: typeof PRESETS[0]) => {
    if (fields.length >= MAX_FIELDS) {
      setError(`الحد الأقصى ${MAX_FIELDS} حقول مخصصة.`);
      return;
    }
    if (preset) {
      const already = fields.find((f) => f.id === preset.id);
      if (already) return;
      setFields((p) => [...p, {
        id: preset.id,
        label: preset.label,
        type: preset.type as any,
        required: false,
        placeholder: (preset as any).placeholder || '',
        options: (preset as any).options || '',
      }]);
    } else {
      setFields((p) => [...p, newField()]);
    }
  };

  const updateField = (id: string, key: keyof FormField, val: any) => {
    setFields((p) => p.map((f) => f.id === id ? { ...f, [key]: val } : f));
  };

  const removeField = (id: string) => {
    setFields((p) => p.filter((f) => f.id !== id));
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setFields((p) => {
      const next = [...p];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const moveDown = (idx: number) => {
    setFields((p) => {
      if (idx >= p.length - 1) return p;
      const next = [...p];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const handleSave = async () => {
    setError('');
    // Validate labels
    for (const f of fields) {
      if (!f.label.trim()) {
        setError('كل حقل يجب أن يكون له اسم/تسمية.');
        return;
      }
      if (f.type === 'select' && !f.options?.trim()) {
        setError(`حقل "${f.label}" من نوع قائمة اختيار يحتاج خيارات.`);
        return;
      }
    }

    // Validate Google Sheet URL
    if (webhook.trim()) {
      const sheetVal = validateGoogleSheetUrl(webhook.trim());
      if (!sheetVal.isValid) {
        setError(sheetVal.error || 'رابط Google Sheet غير صالح.');
        return;
      }
    }

    setSaving(true);
    try {
      // Normalize select options to arrays for storage
      const cleanFields = fields.map((f) => ({
        ...f,
        label: f.label.trim(),
        placeholder: f.placeholder?.trim() || '',
        options: f.type === 'select'
          ? (f.options || '').split(',').map((o) => o.trim()).filter(Boolean)
          : undefined,
      }));

      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseFormSchema: JSON.stringify(cleanFields),
          sheetsWebhookUrl: webhook.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('تم حفظ إعدادات نموذج الطلب.');
        if (onSaved) onSaved();
      } else {
        setError(data.error || 'فشل الحفظ.');
      }
    } catch {
      setError('خطأ في الاتصال.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5" dir="rtl">
      {error && (
        <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Base fields (read-only) */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">الحقول الأساسية (ثابتة)</p>
        {BASE_FIELDS.map((f) => (
          <div key={f.id} className="flex items-center gap-3 px-3 py-2 bg-slate-900/50 border border-slate-800 rounded-xl opacity-60">
            <span className="text-xs font-bold text-stone-300 flex-1">{f.label}</span>
            <span className="text-[10px] text-teal-400 bg-teal-950 px-2 py-0.5 rounded">{TYPE_LABELS[f.type]}</span>
            <span className="text-[10px] text-rose-400">مطلوب</span>
          </div>
        ))}
      </div>

      {/* Custom fields */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
          الحقول المخصصة ({fields.length}/{MAX_FIELDS})
        </p>
        {fields.map((f, idx) => (
          <div key={f.id} className="border border-slate-700 bg-slate-900/60 rounded-xl p-3 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-0.5">
                <button type="button" onClick={() => moveUp(idx)} disabled={idx === 0}
                  className="text-stone-500 hover:text-white disabled:opacity-20 text-[10px] leading-none">▲</button>
                <button type="button" onClick={() => moveDown(idx)} disabled={idx === fields.length - 1}
                  className="text-stone-500 hover:text-white disabled:opacity-20 text-[10px] leading-none">▼</button>
              </div>
              <input
                value={f.label}
                onChange={(e) => updateField(f.id, 'label', e.target.value)}
                placeholder="اسم الحقل (مثال: الولاية)"
                maxLength={60}
                className="flex-1 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:border-teal-500 outline-none"
              />
              <select value={f.type} onChange={(e) => updateField(f.id, 'type', e.target.value)}
                className="px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:border-teal-500 outline-none">
                {Object.entries(TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              <label className="flex items-center gap-1 text-[11px] text-stone-400 whitespace-nowrap cursor-pointer">
                <input type="checkbox" checked={f.required}
                  onChange={(e) => updateField(f.id, 'required', e.target.checked)}
                  className="w-3 h-3 rounded" />
                إلزامي
              </label>
              <button type="button" onClick={() => removeField(f.id)}
                className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950 rounded-lg">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {f.type !== 'select' && (
              <input
                value={f.placeholder || ''}
                onChange={(e) => updateField(f.id, 'placeholder', e.target.value)}
                placeholder="نص توجيهي (placeholder) — اختياري"
                maxLength={100}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-stone-300 focus:border-teal-500 outline-none"
              />
            )}
            {f.type === 'select' && (
              <input
                value={f.options || ''}
                onChange={(e) => updateField(f.id, 'options', e.target.value)}
                placeholder="الخيارات مفصولة بفواصل: الجزائر,وهران,قسنطينة"
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-stone-300 focus:border-teal-500 outline-none"
              />
            )}
          </div>
        ))}

        {fields.length < MAX_FIELDS && (
          <div className="space-y-2">
            {/* Quick presets */}
            <p className="text-[10px] text-stone-500">إضافة سريعة:</p>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.filter((p) => !fields.find((f) => f.id === p.id)).map((preset) => (
                <button key={preset.id} type="button" onClick={() => addField(preset)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 border border-slate-700 text-stone-300 hover:border-teal-600 hover:text-teal-300">
                  + {preset.label}
                </button>
              ))}
              <button type="button" onClick={() => addField()}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-teal-950 border border-teal-700/50 text-teal-300 hover:bg-teal-900 flex items-center gap-1">
                <Plus className="w-3 h-3" /> حقل مخصص
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Google Sheets Destination */}
      <div className="space-y-1.5 pt-3 border-t border-slate-800">
        <label className="text-xs font-bold text-stone-300">رابط جدول Google Sheets الخاص بهذا المنتج (اختياري)</label>
        <input
          value={webhook}
          onChange={(e) => setWebhook(e.target.value)}
          placeholder="https://docs.google.com/spreadsheets/d/.../edit"
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:border-teal-500 outline-none"
        />
        <p className="text-[10px] text-stone-500">
          الصق رابط Google Sheet الخاص بك مباشرة. سيتكفل النظام بإضافة صفوف الطلبات تلقائياً دون أي إعداد تقني.
        </p>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="button" variant="primary" size="sm" isLoading={saving} onClick={handleSave}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold gap-1.5">
          <Save className="w-4 h-4" /> حفظ إعدادات النموذج
        </Button>
      </div>
    </div>
  );
};
