import React from 'react';
import { ShieldCheck, Check } from 'lucide-react';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  className?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  // Dimensions for premium emblem
  const dimensions = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
  };

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4',
  };

  const badgePadding = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
    xl: 'px-4 py-2 text-base',
  };

  if (!showLabel) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full bg-gradient-to-tr from-sky-600 via-sky-500 to-cyan-400 text-white shadow-md shadow-sky-500/30 border border-sky-300/40 shrink-0 ${dimensions[size]} ${className}`}
        title="تم التحقق من الحساب بالشهادات الأكاديمية والهوية"
        aria-label="تم التحقق من الحساب"
      >
        <Check className={`${iconSizes[size]} stroke-[3.5]`} />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-gradient-to-r from-sky-950/90 via-[#0a2540] to-sky-950/90 border border-sky-400/60 text-sky-200 shadow-lg shadow-sky-950/50 backdrop-blur-sm ${badgePadding[size]} ${className}`}
      title="تم التحقق من الحساب بالشهادات الأكاديمية والهوية"
    >
      <span className={`inline-flex items-center justify-center rounded-full bg-gradient-to-tr from-sky-600 via-sky-500 to-cyan-400 text-white shadow-xs p-0.5 ${dimensions.sm}`}>
        <Check className="w-2.5 h-2.5 stroke-[3.5]" />
      </span>
      <span className="tracking-wide">تم التحقق من الحساب 🇩🇿</span>
    </span>
  );
};

