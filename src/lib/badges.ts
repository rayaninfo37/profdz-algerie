/**
 * KRYTY Badge & Identity Token System
 * Implements strict accessibility, contrast, and visual hierarchy
 */

export interface BadgeConfig {
  label: string;
  labelEn: string;
  classes: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  iconName?: string;
  tooltip?: string;
}

export const SUBSCRIPTION_BADGES: Record<string, BadgeConfig> = {
  PRO_ACTIVE: {
    label: 'PRO مُميّز',
    labelEn: 'PRO',
    classes: 'bg-gradient-to-r from-sky-500/20 to-cyan-500/20 text-sky-300 border border-sky-400/40 shadow-sm shadow-sky-950/50',
    textColor: '#7dd3fc',
    bgColor: 'rgba(14, 116, 144, 0.25)',
    borderColor: '#38bdf8',
    iconName: 'Sparkles',
    tooltip: 'أستاذ موثوق ومعتمد باشتراك احترافي',
  },
  FREE_ACTIVE: {
    label: 'حساب عادي',
    labelEn: 'Standard',
    classes: 'bg-stone-800/60 text-stone-300 border border-stone-700',
    textColor: '#d6d3d1',
    bgColor: 'rgba(41, 37, 36, 0.6)',
    borderColor: '#44403c',
    tooltip: 'حساب مجاني نشط',
  },
  PRO_EXPIRED: {
    label: 'منتهي الصلاحية',
    labelEn: 'Expired',
    classes: 'bg-amber-950/40 text-amber-300 border border-amber-800/40',
    textColor: '#fcd34d',
    bgColor: 'rgba(69, 26, 3, 0.4)',
    borderColor: '#92400e',
    tooltip: 'انتهت صلاحية باقة PRO',
  },
  FROZEN: {
    label: 'مُجمّد',
    labelEn: 'Frozen',
    classes: 'bg-rose-950/40 text-rose-300 border border-rose-800/40',
    textColor: '#fca5a5',
    bgColor: 'rgba(76, 5, 25, 0.4)',
    borderColor: '#9f1239',
    tooltip: 'الحساب مجمد مؤقتاً',
  },
};

export const ROLE_BADGES: Record<string, BadgeConfig> = {
  TEACHER: {
    label: 'أستاذ',
    labelEn: 'Teacher',
    classes: 'bg-teal-950/50 text-teal-300 border border-teal-700/50',
    textColor: '#5eead4',
    bgColor: 'rgba(19, 78, 74, 0.5)',
    borderColor: '#0f766e',
  },
  STUDENT: {
    label: 'تلميذ / طالب',
    labelEn: 'Student',
    classes: 'bg-indigo-950/50 text-indigo-300 border border-indigo-700/50',
    textColor: '#a5b4fc',
    bgColor: 'rgba(49, 46, 129, 0.5)',
    borderColor: '#4338ca',
  },
  PARENT: {
    label: 'ولي أمر',
    labelEn: 'Parent',
    classes: 'bg-stone-800/70 text-amber-200 border border-amber-700/40',
    textColor: '#fde68a',
    bgColor: 'rgba(41, 37, 36, 0.7)',
    borderColor: '#b45309',
  },
  ADMIN: {
    label: 'إدارة المنصة',
    labelEn: 'Admin',
    classes: 'bg-rose-950/60 text-rose-300 border border-rose-700/60',
    textColor: '#fda4af',
    bgColor: 'rgba(76, 5, 25, 0.6)',
    borderColor: '#be123c',
  },
};

export const STUDENT_TYPE_BADGES: Record<string, BadgeConfig> = {
  PUPIL_PRIMARY: {
    label: 'تلميذ ابتدائي',
    labelEn: 'Primary Pupil',
    classes: 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40',
    textColor: '#6ee7b7',
    bgColor: 'rgba(6, 78, 59, 0.4)',
    borderColor: '#047857',
  },
  PUPIL_MIDDLE: {
    label: 'تلميذ متوسط (BEM)',
    labelEn: 'Middle School',
    classes: 'bg-cyan-950/40 text-cyan-300 border border-cyan-800/40',
    textColor: '#67e8f9',
    bgColor: 'rgba(22, 78, 99, 0.4)',
    borderColor: '#0e7490',
  },
  PUPIL_SECONDARY: {
    label: 'تلميذ ثانوي (BAC)',
    labelEn: 'Secondary (BAC)',
    classes: 'bg-blue-950/40 text-blue-300 border border-blue-800/40',
    textColor: '#93c5fd',
    bgColor: 'rgba(30, 58, 138, 0.4)',
    borderColor: '#1d4ed8',
  },
  UNIVERSITY: {
    label: 'طالب جامعي',
    labelEn: 'University Student',
    classes: 'bg-purple-950/40 text-purple-300 border border-purple-800/40',
    textColor: '#d8b4fe',
    bgColor: 'rgba(88, 28, 135, 0.4)',
    borderColor: '#7e22ce',
  },
};

export const TITLE_BADGES: Record<string, BadgeConfig> = {
  PROFESSOR: {
    label: 'أستاذ',
    labelEn: 'Prof.',
    classes: 'bg-teal-950/30 text-teal-300 border border-teal-800/40',
    textColor: '#5eead4',
    bgColor: 'rgba(19, 78, 74, 0.3)',
    borderColor: '#115e59',
  },
  DOCTOR: {
    label: 'دكتور',
    labelEn: 'Dr.',
    classes: 'bg-sky-950/30 text-sky-300 border border-sky-800/40',
    textColor: '#7dd3fc',
    bgColor: 'rgba(12, 74, 110, 0.3)',
    borderColor: '#0369a1',
  },
  ENGINEER: {
    label: 'مهندس',
    labelEn: 'Eng.',
    classes: 'bg-amber-950/30 text-amber-300 border border-amber-800/40',
    textColor: '#fcd34d',
    bgColor: 'rgba(69, 26, 3, 0.3)',
    borderColor: '#b45309',
  },
  INSPECTOR: {
    label: 'مفتش تربوي',
    labelEn: 'Inspector',
    classes: 'bg-emerald-950/30 text-emerald-300 border border-emerald-800/40',
    textColor: '#6ee7b7',
    bgColor: 'rgba(6, 78, 59, 0.3)',
    borderColor: '#047857',
  },
};
