import { prisma } from './db';

/**
 * KRYTY Centralized Business & System Configuration
 */

export const KRYTY_CONFIG = {
  platformName: 'PROF DZ',
  platformNameArabic: 'PROF DZ',
  country: 'الجزائر 🇩🇿',
  coverageWilayasCount: 58,

  subscription: {
    trialDurationDays: 30,      // Free trial period for new Teachers (days)
    proPlanPriceDZD: 900,       // Pro Teacher Subscription DZD / 30 days
    proPlanDurationDays: 30,
  },

  ranking: {
    bayesianThreshold_m: 5,     // Minimum review confidence weighting threshold
    globalMeanRating_C: 4.5,   // Global baseline platform rating benchmark
  },

  uploadLimits: {
    maxImageSizeMB: 5,
    maxImageSizeBytes: 5 * 1024 * 1024,
    feedVideoAllowed: false,
    maxProductPreviewImageSizeMB: 1,
    maxProductPreviewImageSizeBytes: 1 * 1024 * 1024,
    maxPostImageSizeMB: 3,
    maxPostImageSizeBytes: 3 * 1024 * 1024,
    maxAvatarSizeMB: 2,
    maxAvatarSizeBytes: 2 * 1024 * 1024,
    maxPrivateReceiptSizeMB: 5,
    maxPrivateReceiptSizeBytes: 5 * 1024 * 1024,
    maxFeedPostCharacters: 500,
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedVideoTypes: [] as string[],
    allowedDocTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  },

  quotas: {
    freeTeacherPostsPerDay: 1,
    proTeacherPostsPerDay: 3,
    freeTeacherActiveProducts: 1,
    proTeacherActiveProducts: 3,
    maxPreviewImagesPerProduct: 4,
    maxQualificationsPerTeacher: 10,
    studentPostsPerDay: 5,
  },

  productMedia: {
    maxCoverSizeBytes: 10 * 1024 * 1024,           // 10 MB cover image
    maxGalleryTotalSizeBytes: 30 * 1024 * 1024,    // 30 MB combined gallery
    maxGalleryImageCount: 6,                        // up to 6 gallery images
  },

  productLimits: {
    maxDescriptionChars: 5000,
    maxTitleChars: 200,
    maxPurchaseFormFields: 7,
  },

  roles: {
    GUEST: 'GUEST',
    STUDENT: 'STUDENT',
    PARENT: 'PARENT',
    TEACHER: 'TEACHER',
    ADMIN: 'ADMIN',
  },
};

/**
 * Authoritative Dynamic Platform Settings Resolver
 * Reads dynamic settings from database with clean fallbacks to KRYTY_CONFIG constants.
 */
export async function getPlatformSettings() {
  try {
    const settings = await prisma.platformSetting.findMany();
    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    return {
      TRIAL_DURATION_DAYS: settingsMap['trialDurationDays']
        ? parseInt(settingsMap['trialDurationDays'], 10)
        : KRYTY_CONFIG.subscription.trialDurationDays,
      PRO_PLAN_PRICE_DZD: settingsMap['proPriceDZD']
        ? parseInt(settingsMap['proPriceDZD'], 10)
        : KRYTY_CONFIG.subscription.proPlanPriceDZD,
      PRO_PLAN_DURATION_DAYS: settingsMap['proDurationDays']
        ? parseInt(settingsMap['proDurationDays'], 10)
        : KRYTY_CONFIG.subscription.proPlanDurationDays,
      CCP_ACCOUNT: settingsMap['ccpAccount'] || '',
      CCP_KEY: settingsMap['ccpKey'] || '',
      BARIDIMOB_RIP: settingsMap['baridiMobRip'] || '',
      ACCOUNT_HOLDER_NAME: settingsMap['accountHolderName'] || '',
    };
  } catch (error) {
    return {
      TRIAL_DURATION_DAYS: KRYTY_CONFIG.subscription.trialDurationDays,
      PRO_PLAN_PRICE_DZD: KRYTY_CONFIG.subscription.proPlanPriceDZD,
      PRO_PLAN_DURATION_DAYS: KRYTY_CONFIG.subscription.proPlanDurationDays,
      CCP_ACCOUNT: '',
      CCP_KEY: '',
      BARIDIMOB_RIP: '',
      ACCOUNT_HOLDER_NAME: '',
    };
  }
}

export async function getTrialDuration(): Promise<number> {
  const s = await getPlatformSettings();
  return s.TRIAL_DURATION_DAYS;
}

export async function getProPrice(): Promise<number> {
  const s = await getPlatformSettings();
  return s.PRO_PLAN_PRICE_DZD;
}

export async function getSubscriptionDuration(): Promise<number> {
  const s = await getPlatformSettings();
  return s.PRO_PLAN_DURATION_DAYS;
}
