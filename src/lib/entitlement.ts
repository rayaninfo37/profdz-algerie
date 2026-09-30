import { prisma } from './db';
import { EntitlementStatus } from '@/types';

export async function hasUserEntitlement(userId: string | null | undefined, productId: string): Promise<boolean> {
  if (!productId) return false;

  // Check if product is free
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { isFree: true, priceDZD: true },
  });

  if (!product) return false;
  if (product.isFree || product.priceDZD === 0) return true;

  if (!userId) return false;

  const entitlement = await prisma.entitlement.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
  });

  return entitlement?.status === EntitlementStatus.ACTIVE;
}

export async function grantEntitlement(userId: string, productId: string) {
  // Upsert Entitlement
  const entitlement = await prisma.entitlement.upsert({
    where: {
      userId_productId: { userId, productId },
    },
    update: {
      status: EntitlementStatus.ACTIVE,
      grantedAt: new Date(),
    },
    create: {
      userId,
      productId,
      status: EntitlementStatus.ACTIVE,
    },
  });

  // Upsert LibraryItem
  await prisma.libraryItem.upsert({
    where: {
      userId_productId: { userId, productId },
    },
    update: {
      addedAt: new Date(),
    },
    create: {
      userId,
      productId,
    },
  });

  return entitlement;
}

export async function getUserLibrary(userId: string) {
  const items = await prisma.libraryItem.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          assets: true,
          modules: {
            include: {
              lessons: true,
            },
          },
        },
      },
    },
    orderBy: { addedAt: 'desc' },
  });

  return items.map((i) => i.product);
}
