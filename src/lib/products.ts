import { prisma } from '@/lib/db';
import { rankProducts } from '@/lib/productRanking';

export interface EnrichedProduct {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorType: string;
  title: string;
  slug: string;
  description: string;
  coverImage?: string | null;
  productType: string;
  subject: string;
  educationLevel: string;
  priceDZD: number;
  minPriceDZD?: number | null;
  maxPriceDZD?: number | null;
  isFree: boolean;
  previewContent?: string | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  whatsapp?: string | null;
  telegram?: string | null;
  phone?: string | null;
  website?: string | null;
  storeLocation?: string | null;
  teacherSubscriptionState?: string | null;
  teacherIsFrozen?: boolean;
  teacherSoftDeleted?: boolean;
  contactCount: number;
  assets?: Array<{
    id: string;
    title: string;
    fileUrl: string;
    fileType: string;
    assetPurpose?: string;
    fileSizeBytes?: number;
    isFreePreview: boolean;
  }>;
  modules?: Array<{
    id: string;
    title: string;
    order: number;
    lessons: Array<{
      id: string;
      title: string;
      content?: string | null;
      videoUrl?: string | null;
      order: number;
    }>;
  }>;
}

export async function enrichProduct(product: any): Promise<EnrichedProduct> {
  let whatsapp: string | null = null;
  let telegram: string | null = null;
  let phone: string | null = null;
  let website: string | null = null;
  let storeLocation: string | null = null;
  let liveCreatorName: string = product.creatorName;
  let teacherSubscriptionState: string | null = null;
  let teacherIsFrozen: boolean = false;
  let teacherSoftDeleted: boolean = false;

  if (product.creatorType === 'TEACHER') {
    let teacher = await prisma.teacherProfile.findUnique({
      where: { id: product.creatorId },
      include: { user: { select: { fullName: true, isFrozen: true, softDeletedAt: true } } },
    });
    if (!teacher) {
      teacher = await prisma.teacherProfile.findUnique({
        where: { userId: product.creatorId },
        include: { user: { select: { fullName: true, isFrozen: true, softDeletedAt: true } } },
      });
    }
    if (teacher) {
      whatsapp = teacher.whatsapp;
      telegram = teacher.telegram;
      phone = teacher.phone;
      website = (teacher as any).website || null;
      storeLocation = teacher.storeLocation;
      teacherSubscriptionState = teacher.subscriptionState;
      teacherIsFrozen = Boolean(teacher.user?.isFrozen);
      teacherSoftDeleted = Boolean(teacher.user?.softDeletedAt);
      if (teacher.user?.fullName) {
        liveCreatorName = teacher.user.fullName;
      }
    }
  } else if (product.creatorType === 'INSTITUTION') {
    const inst = await prisma.institutionProfile.findUnique({
      where: { id: product.creatorId },
      select: { id: true, phone: true, website: true, name: true },
    });
    if (inst) {
      phone = inst.phone;
      website = inst.website || null;
      if (inst.name) {
        liveCreatorName = inst.name;
      }
    }
  }

  const contactCount = await prisma.contactEvent.count({
    where: { productId: product.id },
  });

  return {
    ...product,
    creatorName: liveCreatorName,
    whatsapp,
    telegram,
    phone,
    website,
    storeLocation,
    teacherSubscriptionState,
    teacherIsFrozen,
    teacherSoftDeleted,
    contactCount,
  };
}

export async function enrichProducts(products: any[]): Promise<EnrichedProduct[]> {
  if (!products || products.length === 0) return [];

  const teacherIds = products.filter((p) => p.creatorType === 'TEACHER').map((p) => p.creatorId);
  const instIds = products.filter((p) => p.creatorType === 'INSTITUTION').map((p) => p.creatorId);
  const productIds = products.map((p) => p.id);

  const [teachers, institutions, contactCounts] = await Promise.all([
    teacherIds.length > 0
      ? prisma.teacherProfile.findMany({
          where: {
            OR: [
              { id: { in: teacherIds } },
              { userId: { in: teacherIds } },
            ],
          },
          select: {
            id: true,
            userId: true,
            whatsapp: true,
            telegram: true,
            phone: true,
            storeLocation: true,
            subscriptionState: true,
            user: { select: { isFrozen: true, softDeletedAt: true } },
          },
        })
      : [],
    instIds.length > 0
      ? prisma.institutionProfile.findMany({
          where: { id: { in: instIds } },
          select: { id: true, phone: true },
        })
      : [],
    prisma.contactEvent.groupBy({
      by: ['productId'],
      where: { productId: { in: productIds } },
      _count: { id: true },
    }),
  ]);

  const teacherMap = new Map();
  for (const t of teachers) {
    teacherMap.set(t.id, t);
    teacherMap.set(t.userId, t);
  }
  const instMap = new Map(institutions.map((i) => [i.id, i]));
  const countMap = new Map(contactCounts.map((c) => [c.productId, c._count.id]));

  return products.map((product) => {
    let whatsapp: string | null = null;
    let telegram: string | null = null;
    let phone: string | null = null;
    let storeLocation: string | null = null;
    let teacherSubscriptionState: string | null = null;
    let teacherIsFrozen: boolean = false;
    let teacherSoftDeleted: boolean = false;

    if (product.creatorType === 'TEACHER') {
      const t = teacherMap.get(product.creatorId);
      if (t) {
        whatsapp = t.whatsapp;
        telegram = t.telegram;
        phone = t.phone;
        storeLocation = t.storeLocation;
        teacherSubscriptionState = t.subscriptionState;
        teacherIsFrozen = Boolean(t.user?.isFrozen);
        teacherSoftDeleted = Boolean(t.user?.softDeletedAt);
      }
    } else if (product.creatorType === 'INSTITUTION') {
      const inst = instMap.get(product.creatorId);
      if (inst) {
        phone = inst.phone;
      }
    }

    return {
      ...product,
      whatsapp,
      telegram,
      phone,
      storeLocation,
      teacherSubscriptionState,
      teacherIsFrozen,
      teacherSoftDeleted,
      contactCount: countMap.get(product.id) || 0,
    };
  });
}

/**
 * Dynamic Product Public Eligibility:
 * A product is publicly discoverable if:
 * 1. It is published (isPublished = true).
 * 2. If creator is TEACHER, the teacher must not be frozen or soft-deleted, and must have valid active subscription and contact.
 */
export function isPublicProduct(product: {
  isPublished: boolean;
  creatorType?: string;
  whatsapp?: string | null;
  telegram?: string | null;
  teacherSubscriptionState?: string | null;
  teacherIsFrozen?: boolean;
  teacherSoftDeleted?: boolean;
}): boolean {
  if (!product.isPublished) return false;
  if (product.creatorType === 'TEACHER') {
    // If teacher is frozen or deleted, hide immediately
    if (product.teacherIsFrozen || product.teacherSoftDeleted) {
      return false;
    }
    // If teacher is frozen or expired subscription, products are hidden from public store
    if (
      product.teacherSubscriptionState &&
      !['FREE_ACTIVE', 'PRO_ACTIVE'].includes(product.teacherSubscriptionState)
    ) {
      return false;
    }
    const hasWhatsapp = Boolean(product.whatsapp && product.whatsapp.trim().length > 0);
    const hasTelegram = Boolean(product.telegram && product.telegram.trim().length > 0);
    return hasWhatsapp || hasTelegram;
  }
  return true;
}

// In-Memory Real-Time Product Catalog Snapshot Cache (5 seconds TTL)
let cachedProductsSnapshot: { data: any[]; timestamp: number } | null = null;
let productsPromise: Promise<any[]> | null = null;
const PRODUCTS_CACHE_TTL_MS = 5 * 1000;

export async function getPublicRankedProductsCached(limit = 60): Promise<any[]> {
  const now = Date.now();
  if (cachedProductsSnapshot && now - cachedProductsSnapshot.timestamp < PRODUCTS_CACHE_TTL_MS) {
    return cachedProductsSnapshot.data.slice(0, limit);
  }

  if (productsPromise) {
    const all = await productsPromise;
    return all.slice(0, limit);
  }

  productsPromise = (async () => {
    try {
      const rawProducts = await prisma.product.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: 'desc' },
        take: 60,
        select: {
          id: true,
          creatorId: true,
          creatorName: true,
          creatorType: true,
          title: true,
          slug: true,
          description: true,
          coverImage: true,
          productType: true,
          subject: true,
          educationLevel: true,
          priceDZD: true,
          isFree: true,
          previewContent: true,
          isPublished: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const allEnriched = await enrichProducts(rawProducts);
      const eligibleProducts = allEnriched.filter(isPublicProduct);
      const ranked = rankProducts(eligibleProducts);
      const products = ranked.map((r) => r.product);

      cachedProductsSnapshot = {
        data: products,
        timestamp: Date.now(),
      };

      return products;
    } finally {
      productsPromise = null;
    }
  })();

  const all = await productsPromise;
  return all.slice(0, limit);
}

export function invalidateProductCache(): void {
  cachedProductsSnapshot = null;
  productsPromise = null;
}

