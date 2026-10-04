import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole, SubscriptionState } from '@/types';
import { hasUserEntitlement } from '@/lib/entitlement';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        assets: true,
        modules: {
          include: {
            lessons: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'المورد الرقمي غير موجود' }, { status: 404 });
    }

    // Always fetch LIVE teacher data — never rely on creatorName snapshot
    let liveTeacher = await prisma.teacherProfile.findUnique({
      where: { id: product.creatorId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            wilaya: true,
            isFrozen: true,
            softDeletedAt: true,
          },
        },
      },
    });

    if (!liveTeacher) {
      liveTeacher = await prisma.teacherProfile.findUnique({
        where: { userId: product.creatorId },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              wilaya: true,
              isFrozen: true,
              softDeletedAt: true,
            },
          },
        },
      });
    }

    // If teacher is frozen/deleted, product is still readable but contact hidden
    const teacherActive = liveTeacher &&
      !liveTeacher.user?.isFrozen &&
      !liveTeacher.user?.softDeletedAt;

    const user = await getCurrentUser().catch(() => null);
    const userId = user?.id || null;

    // Entitlement check: free products or entitled users get all assets
    const entitled = await hasUserEntitlement(userId, product.id);

    // Filter assets: non-entitled users only see isFreePreview assets
    const filteredAssets = entitled
      ? product.assets
      : product.assets.filter((a) => a.isFreePreview);

    // Filter lesson content for non-entitled users
    const filteredModules = product.modules.map((mod) => ({
      ...mod,
      lessons: mod.lessons.map((lesson) => ({
        ...lesson,
        videoUrl: entitled ? lesson.videoUrl : null,
        content: entitled ? lesson.content : (lesson.content ? lesson.content.slice(0, 200) + '...' : null),
      })),
    }));

    // Build live teacher contact — only for authenticated users, only if teacher is active
    const liveContact = (user && teacherActive && liveTeacher) ? {
      teacherPhone: liveTeacher.phone,
      teacherWhatsapp: liveTeacher.whatsapp,
      teacherTelegram: liveTeacher.telegram,
      teacherWebsite: liveTeacher.website,
      teacherName: liveTeacher.user?.fullName,
      teacherAvatarUrl: liveTeacher.user?.avatarUrl,
      teacherWilaya: liveTeacher.user?.wilaya,
    } : {};

    // Strip the snapshot creatorName — always use live data
    const { creatorName: _snap, ...productData } = product as any;

    return NextResponse.json({
      success: true,
      product: {
        ...productData,
        // Live creator name from user record
        creatorName: liveTeacher?.user?.fullName || product.creatorName,
        assets: filteredAssets,
        modules: filteredModules,
        isEntitled: entitled,
        teacherActive,
        ...liveContact,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'فشل في استرجاع بيانات المورد' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول لتعديل المورد' }, { status: 401 });
    }

    const { id } = await params;
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
      return NextResponse.json({ error: 'المورد الرقمي غير موجود' }, { status: 404 });
    }

    // IDOR: always verify ownership against DB — never trust client-sent IDs
    const teacherProfile = await prisma.teacherProfile.findUnique({ where: { userId: user.id } });
    const isOwner = (teacherProfile && teacherProfile.id === product.creatorId) || user.id === product.creatorId;
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'غير مصرح لك بتعديل هذا المورد' }, { status: 403 });
    }

    // Freeze check
    if (!isAdmin) {
      if (user.isFrozen) return NextResponse.json({ error: 'حسابك مجمّد.' }, { status: 403 });
      if (user.softDeletedAt) return NextResponse.json({ error: 'هذا الحساب تم حذفه.' }, { status: 403 });
      if (teacherProfile?.subscriptionState === SubscriptionState.FROZEN) {
        return NextResponse.json({ error: 'حسابك في حالة تجميد. يرجى الترقية لتعديل منتجاتك.' }, { status: 403 });
      }
    }

    const body = await request.json();
    const { title, description, priceDZD, isFree, subject, educationLevel, productType, coverImage, previewContent, isPublished, youtubeUrl, educationTargets, purchaseFormSchema } = body;

    // Text limit validation
    const { KRYTY_CONFIG: cfg } = await import('@/lib/config');
    if (title !== undefined && String(title).trim().length > (cfg.productLimits?.maxTitleChars ?? 200)) {
      return NextResponse.json({ error: `عنوان المنتج يجب ألا يتجاوز ${cfg.productLimits?.maxTitleChars ?? 200} حرفاً.` }, { status: 400 });
    }
    if (description !== undefined && String(description).trim().length > (cfg.productLimits?.maxDescriptionChars ?? 5000)) {
      return NextResponse.json({ error: `وصف المنتج يجب ألا يتجاوز ${cfg.productLimits?.maxDescriptionChars ?? 5000} حرفاً.` }, { status: 400 });
    }

    // Single canonical price
    let parsedPrice: number | undefined = undefined;
    if (priceDZD !== undefined) {
      const p = parseFloat(String(priceDZD));
      if (!isNaN(p) && p >= 0) parsedPrice = p;
    }

    // YouTube URL validation
    let storedYoutubeId: string | null | undefined = undefined;
    if (youtubeUrl !== undefined) {
      if (!youtubeUrl || !String(youtubeUrl).trim()) {
        storedYoutubeId = null; // clear
      } else {
        const { validateYouTubeUrl } = await import('@/lib/youtubeUtils');
        const ytVal = validateYouTubeUrl(String(youtubeUrl));
        if (!ytVal.valid) return NextResponse.json({ error: ytVal.error }, { status: 400 });
        storedYoutubeId = ytVal.videoId;
      }
    }

    // Education targets
    let educationTargetsStr: string | undefined = undefined;
    if (educationTargets !== undefined) {
      const allowed = ['PRIMARY', 'MIDDLE', 'SECONDARY', 'UNIVERSITY', 'ALL', '3AS', 'BEM', 'BAC', 'CEM', 'BTS'];
      const arr = Array.isArray(educationTargets) ? educationTargets : [];
      educationTargetsStr = JSON.stringify(arr.filter((t: string) => allowed.includes(t)));
    }

    // Purchase form schema validation
    let purchaseFormSchemaStr: string | undefined = undefined;
    if (purchaseFormSchema !== undefined) {
      try {
        const pfs = typeof purchaseFormSchema === 'string'
          ? JSON.parse(purchaseFormSchema)
          : purchaseFormSchema;
        if (Array.isArray(pfs)) {
          if (pfs.length > (cfg.productLimits?.maxPurchaseFormFields ?? 15)) {
            return NextResponse.json({ error: `لا يمكن إضافة أكثر من ${cfg.productLimits?.maxPurchaseFormFields ?? 15} حقلاً في استمارة الشراء.` }, { status: 400 });
          }
          purchaseFormSchemaStr = JSON.stringify(pfs);
        }
      } catch { /* ignore invalid JSON */ }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: String(title).trim() } : {}),
        ...(description !== undefined ? { description: String(description).trim() } : {}),
        ...(parsedPrice !== undefined ? { priceDZD: isFree ? 0 : parsedPrice } : {}),
        ...(isFree !== undefined ? { isFree: Boolean(isFree) } : {}),
        minPriceDZD: null, // legacy fields always null
        maxPriceDZD: null,
        ...(subject !== undefined ? { subject: String(subject).trim() } : {}),
        ...(educationLevel !== undefined ? { educationLevel: String(educationLevel).trim() } : {}),
        ...(educationTargetsStr !== undefined ? { educationTargets: educationTargetsStr } : {}),
        ...(productType !== undefined ? { productType: String(productType) } : {}),
        ...(coverImage !== undefined ? { coverImage } : {}),
        ...(previewContent !== undefined ? { previewContent } : {}),
        ...(isPublished !== undefined ? { isPublished: Boolean(isPublished) } : {}),
        ...(storedYoutubeId !== undefined ? { youtubeUrl: storedYoutubeId } : {}),
        ...(purchaseFormSchemaStr !== undefined ? { purchaseFormSchema: purchaseFormSchemaStr } : {}),
      },
    });

    // Invalidate product cache, ranking snapshot and ISR page caches
    const { invalidateRankingCache } = await import('@/lib/ranking');
    const { invalidateProductCache } = await import('@/lib/products');
    const { revalidatePath } = await import('next/cache');
    invalidateRankingCache();
    invalidateProductCache();
    revalidatePath('/products');
    revalidatePath('/');
    revalidatePath('/dashboard/teacher');
    if (updatedProduct.slug) {
      revalidatePath(`/products/${updatedProduct.slug}`);
    }

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'UPDATE_PRODUCT',
        target: product.id,
        category: 'ADMIN',
        details: `Product "${updatedProduct.title}" updated`,
      },
    });

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error: any) {
    console.error('Update product error:', error?.message);
    return NextResponse.json({ error: 'فشل في تعديل المورد التعليمي' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return PUT(request, context);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'يجب تسجيل الدخول لحذف المورد' }, { status: 401 });

    const { id } = await params;
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return NextResponse.json({ error: 'المورد الرقمي غير موجود' }, { status: 404 });

    // IDOR: server-side ownership check
    const teacherProfile = await prisma.teacherProfile.findUnique({ where: { userId: user.id } });
    const isOwner = (teacherProfile && teacherProfile.id === product.creatorId) || user.id === product.creatorId;
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'غير مصرح لك بحذف هذا المورد' }, { status: 403 });
    }

    if (!isAdmin) {
      if (user.isFrozen || user.softDeletedAt) {
        return NextResponse.json({ error: 'حسابك مجمّد.' }, { status: 403 });
      }
      if (teacherProfile?.subscriptionState === SubscriptionState.FROZEN) {
        return NextResponse.json({ error: 'حسابك في حالة تجميد. يرجى الترقية لإدارة منتجاتك.' }, { status: 403 });
      }
    }

    // Cleanly delete product and related records in transaction
    await prisma.$transaction(async (tx) => {
      await tx.productAsset.deleteMany({ where: { productId: id } });
      await tx.productReview.deleteMany({ where: { productId: id } });
      await tx.comment.deleteMany({ where: { productId: id } });
      await tx.productContactRequest.deleteMany({ where: { productId: id } });
      await tx.productView.deleteMany({ where: { productId: id } });
      await tx.entitlement.deleteMany({ where: { productId: id } });
      await tx.libraryItem.deleteMany({ where: { productId: id } });
      await tx.orderItem.deleteMany({ where: { productId: id } });
      const modules = await tx.courseModule.findMany({ where: { productId: id }, select: { id: true } });
      for (const mod of modules) {
        await tx.lesson.deleteMany({ where: { moduleId: mod.id } });
      }
      await tx.courseModule.deleteMany({ where: { productId: id } });
      await tx.product.delete({ where: { id } });
    });

    const { invalidateRankingCache } = await import('@/lib/ranking');
    const { invalidateProductCache } = await import('@/lib/products');
    const { revalidatePath } = await import('next/cache');
    invalidateRankingCache();
    invalidateProductCache();
    revalidatePath('/products');
    revalidatePath('/');
    revalidatePath('/dashboard/teacher');
    if (product.slug) {
      revalidatePath(`/products/${product.slug}`);
    }

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'DELETE_PRODUCT',
        target: id,
        category: 'ADMIN',
        details: `Product "${product.title}" deleted by ${user.fullName} (${user.role})`,
      },
    });

    return NextResponse.json({ success: true, message: 'تم حذف المورد التعليمي بنجاح' });
  } catch (error: any) {
    console.error('Delete product error:', error?.message);
    return NextResponse.json({ error: 'فشل في حذف المورد التعليمي' }, { status: 500 });
  }
}