'use client';

import React from 'react';
import { CheckCircle2, Circle, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface ProfileCompletenessCardProps {
  percentage: number;
  missingFields: string[];
  role: string;
}

export const ProfileCompletenessCard: React.FC<ProfileCompletenessCardProps> = ({
  percentage,
  missingFields,
  role,
}) => {
  const isComplete = percentage >= 100;

  return (
    <div className="clean-card p-6 space-y-4 bg-[#111D38] border border-[#1E3A5F] text-stone-100">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            نسبة اكتمال الملف الشخصي ({percentage}%)
          </h3>
          <p className="text-xs text-stone-400">
            الملفات الأكثر اكتمالاً تحصل على نسبة ظهور أعلى بـ 3 أضعاف في نتائج اكتشاف الأساتذة.
          </p>
        </div>

        <span className="text-xl font-black text-amber-400 font-mono">
          {percentage}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
        <div
          className="h-full bg-gradient-to-r from-teal-500 to-amber-400 transition-all duration-500 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Missing Fields Suggestions */}
      {!isComplete && missingFields.length > 0 && (
        <div className="pt-2 space-y-2 border-t border-slate-800 text-xs">
          <span className="text-stone-300 font-bold">الحقول المتبقية لإكمال الملف:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {missingFields.map((field, idx) => (
              <div key={idx} className="flex items-center gap-2 text-stone-400">
                <Circle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{field}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isComplete && (
        <div className="p-3 bg-teal-950/80 border border-teal-700/60 rounded-xl text-xs text-teal-300 font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          تهانينا! ملفك الشخصي مكتمل وموثوق بنسبة 100%.
        </div>
      )}
    </div>
  );
};
