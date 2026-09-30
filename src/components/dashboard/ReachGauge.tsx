'use client';

import React, { useState } from 'react';
import { Eye, Lock, Sparkles, Zap, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PaymentProofModal } from '@/components/dashboard/PaymentProofModal';

export interface ReachGaugeProps {
  reachCount: number;
  freeLimit: number;
  subscriptionState: string;
  onUpgradeSuccess?: () => void;
}

export const ReachGauge: React.FC<ReachGaugeProps> = ({
  reachCount,
  freeLimit,
  subscriptionState,
  onUpgradeSuccess,
}) => {
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const isPro = subscriptionState === 'PRO_ACTIVE';
  const isFrozen = subscriptionState === 'FROZEN';
  const percentage = Math.min(100, Math.round((reachCount / freeLimit) * 100));

  return (
    <>
      <div className="clean-card p-6 space-y-4 bg-[#111D38] border border-[#1E3A5F] text-stone-100 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-950 border border-teal-700 text-teal-400 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                مؤشر وصول الملف الشخصي (Profile Reach Meter)
                {isPro && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-amber-950 text-amber-300 border border-amber-500/50 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" /> PRO ACTIVE (وصول غير محدود)
                  </span>
                )}
              </h3>
              <p className="text-xs text-stone-400">
                عدد المشاهدين المسجلين الفريدين لملفك الشخصي (Unique Registered Profile Viewers)
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-2xl font-black text-teal-400">{reachCount}</span>
            {!isPro && <span className="text-xs text-stone-400"> / {freeLimit} أقصى حد مجاني</span>}
          </div>
        </div>

        {/* Linear Reach Gauge Bar */}
        {!isPro && (
          <div className="space-y-1.5">
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
              <div
                className={`h-full transition-all duration-500 ${
                  isFrozen ? 'bg-rose-600' : percentage > 80 ? 'bg-amber-500' : 'bg-teal-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-medium text-stone-400">
              <span>{percentage}% من السقف المجاني مستهلك</span>
              <span>متبقي {Math.max(0, freeLimit - reachCount)} مشاهد مسجل فريد</span>
            </div>
          </div>
        )}

        {/* Frozen Alert Banner */}
        {isFrozen && (
          <div className="p-4 bg-rose-950/80 border border-rose-800 rounded-2xl space-y-3">
            <div className="flex items-start gap-3 text-rose-200">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <h4 className="font-bold text-white">تم تجميد ظهور ملفك العام لانتهاء الفترة التجريبية المجانية (30 يوماً)</h4>
                <p className="text-rose-200/90 leading-relaxed">
                  حسابك الآن في حالة <strong className="text-white">FROZEN</strong>. ملفك ومحتواك وتقييماتك محفوظة بالكامل، ولتفعيل الظهور المستمر أمام الطلاب وفتح ميزات PRO، يرجى رفع وصل التحويل.
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              className="w-full gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold"
              onClick={() => setProofModalOpen(true)}
            >
              <Zap className="w-4 h-4 text-amber-200" /> رفع وصل التحويل وتفعيل باقة PRO
            </Button>
          </div>
        )}

        {!isPro && !isFrozen && (
          <div className="flex justify-end pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setProofModalOpen(true)}
              className="border-amber-500/50 text-amber-300 hover:bg-amber-950/50 font-bold"
            >
              ترقية إلى PRO
            </Button>
          </div>
        )}
      </div>

      <PaymentProofModal
        isOpen={proofModalOpen}
        onClose={() => setProofModalOpen(false)}
        onSuccess={() => {
          if (onUpgradeSuccess) onUpgradeSuccess();
          window.location.reload();
        }}
      />
    </>
  );
};
