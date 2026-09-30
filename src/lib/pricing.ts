import { prisma } from '@/lib/db';
import { KRYTY_CONFIG } from '@/lib/config';

export interface PlanData {
  id: string;
  code: string;
  targetPersona: string; // TEACHER, ACADEMIC, INSTITUTION
  nameAr: string;
  nameFr: string;
  nameEn: string;
  priceDZD: number;
  durationDays: number;
  features: string[];
  limits: Record<string, any>;
  isActive: boolean;
  isTrialEligible: boolean;
  order: number;
}

const DEFAULT_PLANS: PlanData[] = [
  {
    id: 'default-teacher-free',
    code: 'TEACHER_FREE',
    targetPersona: 'TEACHER',
    nameAr: 'الحساب المجاني (تجربة 30 يوماً)',
    nameFr: 'Compte Gratuit (Essai 30 jours)',
    nameEn: 'Free Account (30-Day Trial)',
    priceDZD: 0,
    durationDays: 30,
    features: [
      'ملف شخصي موثق وظهور عام',
      'إمكانية إضافة منتج ومورد تعليمي واحد',
      'نشر نصائح ومنشورات تعليمية يومية',
      'استقبال استفسارات وتواصل الطلاب والأولياء',
    ],
    limits: { activeProducts: 1, postsPerDay: 1 },
    isActive: true,
    isTrialEligible: true,
    order: 1,
  },
  {
    id: 'default-teacher-pro',
    code: 'TEACHER_PRO',
    targetPersona: 'TEACHER',
    nameAr: 'الباقة الاحترافية للأستاذ (PRO)',
    nameFr: 'Pass Enseignant PRO',
    nameEn: 'Teacher PRO Plan',
    priceDZD: 900,
    durationDays: 30,
    features: [
      'ظهور غير محدود في دليل الأساتذة ومحركات البحث',
      'نشر حتى 3 منتجات تعليمية نشطة في المتجر',
      'شعار التوثيق المميز والتحليلات المتقدمة للزوار',
      'أولوية الظهور في التوصيات وموجز المجتمع',
      'دعم كامل للتواصل المباشر عبر واتساب وتيليغرام',
    ],
    limits: { activeProducts: 3, postsPerDay: 3 },
    isActive: true,
    isTrialEligible: false,
    order: 2,
  },
  {
    id: 'default-academic-pro',
    code: 'ACADEMIC_PRO',
    targetPersona: 'ACADEMIC',
    nameAr: 'باقة الأكاديمي والباحث الجامعي (PRO)',
    nameFr: 'Pass Universitaire & Chercheur PRO',
    nameEn: 'Academic & Researcher PRO',
    priceDZD: 3500,
    durationDays: 30,
    features: [
      'ملف أكاديمي مخصص للتعليم العالي والبحوث',
      'نشر المراجع والملخصات الجامعية المتقدمة',
      'قناة تواصل موجهة للطلبة والباحثين',
      'أولوية في دليل الأكاديميين الوطني',
    ],
    limits: { activeProducts: 5, postsPerDay: 5 },
    isActive: true,
    isTrialEligible: false,
    order: 3,
  },
  {
    id: 'default-institution-standard',
    code: 'INSTITUTION_STANDARD',
    targetPersona: 'INSTITUTION',
    nameAr: 'اشتراك المؤسسة التعليمية المعتمدة',
    nameFr: 'Abonnement Établissement Agréé',
    nameEn: 'Certified Institution Plan',
    priceDZD: 9500,
    durationDays: 30,
    features: [
      'ملف مؤسساتي كامل (مدارس خاصة، مراكز لغات، مراكز تدريب)',
      'إدراج وربط الطاقم التعليمي والأساتذة التابعين للمؤسسة',
      'نشر الدورات والخدمات والبرامج التدريبية',
      'ظهور بارز في دليل المؤسسات التعليمية الجزائرية',
    ],
    limits: { staffLimit: 20, activeCourses: 10 },
    isActive: true,
    isTrialEligible: false,
    order: 4,
  },
];

/**
 * Single source of truth for Plans and Pricing across the platform.
 * Reads dynamically from the database, falling back cleanly to DEFAULT_PLANS.
 */
export async function getActivePlans(persona?: string): Promise<PlanData[]> {
  try {
    const where: any = { isActive: true };
    if (persona) where.targetPersona = persona;

    const dbPlans = await prisma.plan.findMany({
      where,
      orderBy: { order: 'asc' },
    });

    if (dbPlans && dbPlans.length > 0) {
      return dbPlans.map((p) => ({
        id: p.id,
        code: p.code,
        targetPersona: p.targetPersona,
        nameAr: p.nameAr,
        nameFr: p.nameFr,
        nameEn: p.nameEn,
        priceDZD: p.priceDZD,
        durationDays: p.durationDays,
        features: JSON.parse(p.featuresJson || '[]'),
        limits: JSON.parse(p.limitsJson || '{}'),
        isActive: p.isActive,
        isTrialEligible: p.isTrialEligible,
        order: p.order,
      }));
    }
  } catch (err) {
    console.warn('Failed to load plans from DB, falling back to defaults:', err);
  }

  if (persona) {
    return DEFAULT_PLANS.filter((p) => p.targetPersona === persona && p.isActive);
  }
  return DEFAULT_PLANS;
}

export async function getPlanByCode(code: string): Promise<PlanData | null> {
  try {
    const dbPlan = await prisma.plan.findUnique({ where: { code } });
    if (dbPlan) {
      return {
        id: dbPlan.id,
        code: dbPlan.code,
        targetPersona: dbPlan.targetPersona,
        nameAr: dbPlan.nameAr,
        nameFr: dbPlan.nameFr,
        nameEn: dbPlan.nameEn,
        priceDZD: dbPlan.priceDZD,
        durationDays: dbPlan.durationDays,
        features: JSON.parse(dbPlan.featuresJson || '[]'),
        limits: JSON.parse(dbPlan.limitsJson || '{}'),
        isActive: dbPlan.isActive,
        isTrialEligible: dbPlan.isTrialEligible,
        order: dbPlan.order,
      };
    }
  } catch (err) {
    console.warn('Error fetching plan by code from DB:', err);
  }

  return DEFAULT_PLANS.find((p) => p.code === code) || null;
}

export async function getTeacherProPrice(): Promise<number> {
  const plan = await getPlanByCode('TEACHER_PRO');
  return plan?.priceDZD ?? KRYTY_CONFIG.subscription.proPlanPriceDZD;
}
