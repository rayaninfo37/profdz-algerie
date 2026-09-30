import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'teal' | 'emerald' | 'burgundy' | 'amber' | 'slate' | 'blue' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'teal',
  size = 'md',
  className,
}) => {
  const baseStyles = 'inline-flex items-center gap-1 font-bold rounded-full border transition-all shadow-xs';

  const variants = {
    teal: 'bg-teal-50 text-teal-800 border-teal-200',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    burgundy: 'bg-burgundy-50 text-burgundy-800 border-burgundy-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    gold: 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold',
    slate: 'bg-stone-100 text-stone-700 border-stone-200',
    blue: 'bg-sky-50 text-sky-800 border-sky-200',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}>
      {children}
    </span>
  );
};

export interface RoleBadgeProps {
  role: string;
  professionalTitle?: string | null;
  studentType?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const TITLE_LABELS: Record<string, string> = {
  PROFESSOR: 'أستاذ',
  DOCTOR: 'دكتور',
  INSPECTOR: 'مفتش تربوي',
};

const STUDENT_LABELS: Record<string, string> = {
  PUPIL_PRIMARY: 'تلميذ ابتدائي',
  PUPIL_MIDDLE: 'تلميذ متوسط',
  PUPIL_SECONDARY: 'تلميذ ثانوي',
  UNIVERSITY: 'طالب جامعي',
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  professionalTitle,
  studentType,
  className = '',
  size = 'sm',
}) => {
  if (role === 'TEACHER') {
    const titleText = (professionalTitle && TITLE_LABELS[professionalTitle]) || 'أستاذ';
    return (
      <Badge variant="teal" size={size} className={className}>
        {titleText}
      </Badge>
    );
  }

  if (role === 'STUDENT') {
    const studentText = (studentType && STUDENT_LABELS[studentType]) || 'طالب / تلميذ';
    return (
      <Badge variant="blue" size={size} className={className}>
        {studentText}
      </Badge>
    );
  }

  if (role === 'PARENT') {
    return (
      <Badge variant="amber" size={size} className={className}>
        ولي أمر
      </Badge>
    );
  }

  if (role === 'ADMIN') {
    return (
      <Badge variant="burgundy" size={size} className={className}>
        إدارة المنصة
      </Badge>
    );
  }

  if (role === 'INSTITUTION') {
    return (
      <Badge variant="slate" size={size} className={className}>
        مؤسسة تعليمية
      </Badge>
    );
  }

  return null;
};

