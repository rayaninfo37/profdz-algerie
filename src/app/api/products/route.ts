import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { enrichProducts, isPublicProduct } from '@/lib/products';
import { UserRole, ProductType, SubscriptionState } from '@/types';
import { KRYTY_CONFIG } from '@/lib/config';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const subject = searchParams.get('subject');
    const level = searchParams.get('level');
    const type = searchParams.get('type');
    const isFree = searchParams.get('isFree');
    const creatorId = searchParams.get('creatorId');
    const takeParam = searchParams.get('take');
    const skipParam = searchParams.get('skip');
    const take = takeParam ? Math.min(Math.max(parseInt(takeParam, 10) || 20, 1), 100) : 50;
    const skip = skipParam ? Math.max(parseInt(skipParam, 10) || 0, 0) : 0;

    const where: any = { isPublished: true };

    if (query) {
      where.OR = [
        { title: { contains: query } },
        { description: { contains: query } },
        { creatorName: { contains: query } },
      ];
    }
    if (subject) where.subject = subject;
    if (level) where.educationLevel = level;
    if (type) where.productType = type;
    if (isFree !== null && isFree !== undefined && isFree !== '') {
      where.isFree = isFree === 'true';
    }
    if (creatorId) where.creatorId = creatorId;

    const [total, rawProducts] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          assets: {
            select: {
              id: true,
              title: true,
              fileType: true,
              isFreePreview: true,
            },
          },
          modules: {
            include: {
              lessons: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
    ]);

    const allEnriched = await enrichProducts(rawProducts);
    const products = allEnriched.filter(isPublicProduct);

    // Strip private contact data for unauthenticated users (Requirement 18)
    const user = await getCurrentUser();
    const safeProducts = !user
      ? products.map(({ whatsapp, telegram, phone, ...rest }) => rest)
      : products;

    return NextResponse.json({ 
      success: true, 
      products: safeProducts,
      pagination: {
        total: safeProducts.length,
        take,
        skip,
        hasMore: skip + safeProducts.length < total,
      },
    });
  } catch (error: any) {
    console.error('Fetch products error:', error);
    return NextResponse.json({ error: 'Failed to fetch digital products catalog' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول لنشر مادة أو كتاب' }, { status: 401 });
    }

    if (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'نشر الموارد والكتب الرقمية متاح للأساتذة المعتمدين فقط.' }, { status: 403 });
    }

    if (user.isFrozen) {
      return NextResponse.json({ error: 'حسابك مجمّد. تواصل مع الإدارة.' }, { status: 403 });
    }
    if (user.softDeletedAt) {
      return NextResponse.json({ error: 'هذا الحساب تم حذفه.' }, { status: 403 });
    }

    // Teacher subscription and active product quota verification
    if (user.role === UserRole.TEACHER) {
      const teacher = await prisma.teacherProfile.findUnique({
        where: { userId: user.id },
      });

      if (!teacher) {
        return NextResponse.json({ error: 'الملف الشخصي للأستاذ غير مكتمل' }, { status: 400 });
      }

      if (teacher.subscriptionState === SubscriptionState.FROZEN) {
        return NextResponse.json({
          error: 'حسابك في حالة تجميد لانتهاء الفترة التجريبية المجانية (30 يوماً). يرجى الترقية إلى PRO لإضافة أو تعديل المنتجات.',
        }, { status: 403 });
      }

      // Workstream 13: Require valid WhatsApp or Telegram before Teacher publishes a product
      const hasWhatsApp = teacher.whatsapp && teacher.whatsapp.trim().length > 0;
      const hasTelegram = teacher.telegram && teacher.telegram.trim().length > 0;

      if (!hasWhatsApp && !hasTelegram) {
        return NextResponse.json({
          error: 'قبل نشر أي مورد أو كتاب في المتجر التعليمي، يجب إضافة رقم واتساب أو حساب تيليغرام صالح في ملفك الشخصي لتسهيل تواصل الطلاب والأولياء معك.',
        }, { status: 400 });
      }

      const isPro = teacher.subscriptionState === SubscriptionState.PRO_ACTIVE;
      const activeCount = await prisma.product.count({
        where: { creatorId: teacher.id, isPublished: true },
      });

      const maxAllowed = isPro
        ? KRYTY_CONFIG.quotas.proTeacherActiveProducts
        : KRYTY_CONFIG.quotas.freeTeacherActiveProducts;

      if (activeCount >= maxAllowed) {
        return NextResponse.json({
          error: isPro
            ? `لقد بلغت الحد الأقصى للمنتجات النشطة (${maxAllowed} منتجات لباقة PRO).`
            : `لقد بلغت الحد الأقصى للمنتجات النشطة للحساب المجاني (${maxAllowed} منتج واحد). للترقية إلى 3 منتجات نشطة، قم بالترقية لباقة PRO.`,
        }, { status: 400 });
      }
    }

    const body = await request.json().catch(() => ({}));
    const {
      title,
      description,
      subject,
      educationLevel,
      productType,
      minPriceDZD,
      maxPriceDZD,
      priceDZD,
      isFree,
      previewContent,
      coverImage,
      coverSizeBytes,
      previewImages,
      galleryImages, // array of { fileUrl, fileSizeBytes, title? }
      productVideo,  // { fileUrl, fileSizeBytes, title? }
      videoUrl,
      videoSizeBytes,
      sampleFileUrl,
      mainFileUrl,
    } = body;

    // Requirement 2: Server-side media validation
    if (coverSizeBytes && typeof coverSizeBytes === 'number') {
      if (coverSizeBytes > KRYTY_CONFIG.productMedia.maxCoverSizeBytes) {
        return NextResponse.json({
          error: 'حجم صورة الغلاف يتجاوز الحد الأقصى المسموح به (1 ميغابايت).',
        }, { status: 400 });
      }
    }

    const combinedGallery = Array.isArray(galleryImages) ? galleryImages : (Array.isArray(previewImages) ? previewImages : []);
    if (combinedGallery.length > KRYTY_CONFIG.productMedia.maxGalleryImageCount) {
      return NextResponse.json({
        error: `الحد الأقصى لصور المعاينة هو ${KRYTY_CONFIG.productMedia.maxGalleryImageCount} صور فقط.`,
      }, { status: 400 });
    }

    const galleryTotalBytes = combinedGallery.reduce((sum: number, img: any) => {
      const size = typeof img === 'object' && img?.fileSizeBytes ? Number(img.fileSizeBytes) : 0;
      return sum + size;
    }, 0);

    if (galleryTotalBytes > KRYTY_CONFIG.productMedia.maxGalleryTotalSizeBytes) {
      return NextResponse.json({
        error: 'الحجم الإجمالي التراكمي لجميع صور المعاينة يجب ألا يتجاوز 1 ميغابايت.',
      }, { status: 400 });
    }

    if (productVideo || videoUrl) {
      return NextResponse.json({
        error: 'منصة قراتي مخصصة للكتب والموارد الرقمية بنسق الصور والـ PDF فقط. رفع مقاطع الفيديو غير مدعوم في هذا الإصدار.',
      }, { status: 400 });
    }

    // Validate subject and education level against taxonomy
    const { isValidSubjectName } = await import('@/lib/taxonomy');
    if (!isValidSubjectName(subject)) {
      return NextResponse.json({ error: `المادة '${subject}' غير صالحة.` }, { status: 400 });
    }

    if (!title || !description || !subject) {
      return NextResponse.json({ error: 'يرجى ملء جميع الحقول الأساسية للمنتج.' }, { status: 400 });
    }

    // Text limits — centralized in config
    const { KRYTY_CONFIG: cfg } = await import('@/lib/config');
    if (title.trim().length > (cfg.productLimits?.maxTitleChars ?? 200)) {
      return NextResponse.json({ error: `عنوان المنتج يجب ألا يتجاوز ${cfg.productLimits?.maxTitleChars ?? 200} حرفاً.` }, { status: 400 });
    }
    if (description.trim().length > (cfg.productLimits?.maxDescriptionChars ?? 5000)) {
      return NextResponse.json({ error: `وصف المنتج يجب ألا يتجاوز ${cfg.productLimits?.maxDescriptionChars ?? 5000} حرفاً.` }, { status: 400 });
    }

    // Single canonical price — priceDZD only
    let parsedPrice = 0;
    if (!isFree) {
      if (priceDZD === undefined || priceDZD === null || priceDZD === '') {
        return NextResponse.json({ error: 'السعر مطلوب لمنتج مدفوع.' }, { status: 400 });
      }
      parsedPrice = parseFloat(String(priceDZD));
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return NextResponse.json({ error: 'السعر يجب أن يكون رقماً موجباً.' }, { status: 400 });
      }
    }

    // YouTube URL validation — server side
    let storedYoutubeId: string | undefined = undefined;
    if (body.youtubeUrl && body.youtubeUrl.trim()) {
      const { validateYouTubeUrl } = await import('@/lib/youtubeUtils');
      const ytValidation = validateYouTubeUrl(body.youtubeUrl);
      if (!ytValidation.valid) {
        return NextResponse.json({ error: ytValidation.error }, { status: 400 });
      }
      storedYoutubeId = ytValidation.videoId || undefined;
    }

    // Education targets — multi-select array
    const allowedTargets = ['PRIMARY', 'MIDDLE', 'SECONDARY', 'UNIVERSITY', 'ALL', '3AS', 'BEM', 'BAC', 'CEM', 'BTS'];
    let educationTargetsArr: string[] = [];
    if (body.educationTargets && Array.isArray(body.educationTargets)) {
      educationTargetsArr = body.educationTargets.filter((t: string) => allowedTargets.includes(t));
    } else if (body.educationTargets && typeof body.educationTargets === 'string') {
      try {
        const parsed = JSON.parse(body.educationTargets);
        if (Array.isArray(parsed)) educationTargetsArr = parsed.filter((t: string) => allowedTargets.includes(t));
      } catch { /* ignore */ }
    }

    // Purchase form schema validation
    let purchaseFormSchemaStr = '[]';
    if (body.purchaseFormSchema) {
      try {
        const pfs = typeof body.purchaseFormSchema === 'string'
          ? JSON.parse(body.purchaseFormSchema)
          : body.purchaseFormSchema;
        if (Array.isArray(pfs)) {
          if (pfs.length > (cfg.productLimits?.maxPurchaseFormFields ?? 15)) {
            return NextResponse.json({ error: `لا يمكن إضافة أكثر من ${cfg.productLimits?.maxPurchaseFormFields ?? 15} حقلاً في استمارة الشراء.` }, { status: 400 });
          }
          purchaseFormSchemaStr = JSON.stringify(pfs);
        }
      } catch { /* ignore invalid JSON, use default */ }
    }

    // Google Sheets URL — accepts regular Google Sheet URLs and legacy webhooks
    let sheetsWebhookUrl: string | undefined = undefined;
    if (body.sheetsWebhookUrl && body.sheetsWebhookUrl.trim()) {
      const { validateGoogleSheetUrl } = await import('@/lib/googleSheets');
      const sheetVal = validateGoogleSheetUrl(body.sheetsWebhookUrl);
      if (sheetVal.isValid) {
        sheetsWebhookUrl = sheetVal.canonicalUrl || body.sheetsWebhookUrl.trim();
      }
    }

    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const cleanBase = baseSlug || 'product';
    const slug = `${cleanBase}-${Date.now().toString().slice(-6)}`;

    // SECURITY: creatorId always derived from session — never from client request
    const teacherProfileForProduct = await prisma.teacherProfile.findUnique({ where: { userId: user.id } });
    const creatorId = teacherProfileForProduct?.id || user.id;
    const creatorType = user.role === UserRole.ADMIN ? 'KRYTY' : 'TEACHER';

    const product = await prisma.$transaction(async (tx) => {
      return tx.product.create({
        data: {
          creatorId,
          creatorName: user.fullName,
          creatorType,
          title: title.trim(),
          slug,
          description: description.trim(),
          coverImage: coverImage || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&auto=format&fit=crop&q=80',
          productType: (productType as ProductType) || ProductType.BOOK,
          subject,
          educationLevel: educationLevel || 'SECONDARY',
          educationTargets: JSON.stringify(educationTargetsArr),
          priceDZD: isFree ? 0 : parsedPrice,
          minPriceDZD: null,  // legacy fields — not used anymore
          maxPriceDZD: null,
          isFree: Boolean(isFree || parsedPrice === 0),
          previewContent: previewContent || '',
          isPublished: true,
          youtubeUrl: storedYoutubeId,
          purchaseFormSchema: purchaseFormSchemaStr,
          sheetsWebhookUrl,
          assets: {
            create: [
              ...(coverImage ? [{
                title: 'Product Cover Image',
                fileUrl: coverImage,
                fileType: 'IMAGE',
                assetPurpose: 'COVER',
                fileSizeBytes: typeof coverSizeBytes === 'number' ? coverSizeBytes : 0,
                isFreePreview: true,
              }] : []),
              ...(Array.isArray(combinedGallery) ? combinedGallery.map((img: any, idx: number) => ({
                title: img?.title || `صورة المعاينة ${idx + 1}`,
                fileUrl: typeof img === 'string' ? img : (img?.fileUrl || img?.url || ''),
                fileType: 'IMAGE',
                assetPurpose: 'GALLERY',
                fileSizeBytes: typeof img === 'object' && img?.fileSizeBytes ? Number(img.fileSizeBytes) : 0,
                isFreePreview: true,
              })).filter((a: any) => a.fileUrl) : []),
              ...(sampleFileUrl ? [{
                title: 'Free Sample Preview',
                fileUrl: sampleFileUrl,
                fileType: 'PDF',
                assetPurpose: 'SAMPLE',
                fileSizeBytes: 0,
                isFreePreview: true,
              }] : []),
              ...(mainFileUrl ? [{
                title: 'Full Product Package (Protected)',
                fileUrl: mainFileUrl,
                fileType: 'PDF',
                assetPurpose: 'ATTACHMENT',
                fileSizeBytes: 0,
                isFreePreview: false,
              }] : []),
            ],
          },
        },
        include: { assets: true },
      });
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'فشل في حفظ ونشر المنتج التعليمي' }, { status: 500 });
  }
}

