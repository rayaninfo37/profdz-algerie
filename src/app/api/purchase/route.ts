import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/middleware/rateLimitMiddleware';

// Public endpoint — no authentication required for purchase submission
export const dynamic = 'force-dynamic';

// Max custom fields allowed (matches teacher form builder limit)
const MAX_CUSTOM_FIELDS = 10;

export async function POST(request: Request) {
  // Rate limit: 5 submissions per minute per IP
  const limitRes = await rateLimit(request, 5, 60_000);
  if (limitRes) return limitRes;

  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'طلب غير صالح.' }, { status: 400 });
    }

    const { productId, firstName, lastName, phone, submissionToken, customFields } = body;

    // Honeypot — bots fill this hidden field
    if (body._hp && String(body._hp).trim()) {
      return NextResponse.json({ success: true }); // silent pass for bots
    }

    // ── Required field validation ─────────────────────────────────────────────
    const safeFirstName = String(firstName || '').trim().substring(0, 100);
    const safeLastName  = String(lastName  || '').trim().substring(0, 100);
    const safePhone     = String(phone     || '').trim().substring(0, 25);
    const safeToken     = String(submissionToken || '').trim().substring(0, 128);

    if (!productId)     return NextResponse.json({ error: 'معرّف المنتج مطلوب.' }, { status: 400 });
    if (!safeFirstName) return NextResponse.json({ error: 'الاسم الأول مطلوب.' }, { status: 400 });
    if (!safeLastName)  return NextResponse.json({ error: 'اللقب مطلوب.' }, { status: 400 });
    if (!safePhone)     return NextResponse.json({ error: 'رقم الهاتف مطلوب.' }, { status: 400 });
    if (!safeToken)     return NextResponse.json({ error: 'رمز الإرسال مطلوب.' }, { status: 400 });

    // ── Product validation ────────────────────────────────────────────────────
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'المنتج غير موجود.' }, { status: 404 });
    }
    if (!product.isPublished) {
      return NextResponse.json({ error: 'هذا المنتج غير متاح للطلب حالياً.' }, { status: 404 });
    }

    // ── Parse & validate purchaseFormSchema from product ─────────────────────
    let savedSchema: Array<{
      id: string;
      label: string;
      type: string;
      required?: boolean;
      options?: string[];
    }> = [];
    try {
      const raw = (product as any).purchaseFormSchema;
      if (raw) savedSchema = JSON.parse(raw);
    } catch { /* empty schema */ }

    // Enforce max custom fields
    if (savedSchema.length > MAX_CUSTOM_FIELDS) {
      savedSchema = savedSchema.slice(0, MAX_CUSTOM_FIELDS);
    }

    // Sanitize and validate custom fields submitted by buyer
    const safeCustomFields: Record<string, string> = {};

    if (customFields && typeof customFields === 'object' && !Array.isArray(customFields)) {
      for (const field of savedSchema) {
        const val = String((customFields as Record<string, unknown>)[field.id] ?? '').trim().substring(0, 1000);

        if (field.required && !val) {
          return NextResponse.json({ error: `الحقل "${field.label}" مطلوب.` }, { status: 400 });
        }

        // Select option validation
        if (field.type === 'select' && field.options?.length && val) {
          if (!field.options.includes(val)) {
            return NextResponse.json({ error: `قيمة غير مقبولة في حقل "${field.label}".` }, { status: 400 });
          }
        }

        if (val) safeCustomFields[field.id] = val;
      }
    } else {
      // No customFields submitted — still check required fields in schema
      for (const field of savedSchema) {
        if (field.required) {
          return NextResponse.json({ error: `الحقل "${field.label}" مطلوب.` }, { status: 400 });
        }
      }
    }

    // ── Find teacher (product owner) ──────────────────────────────────────────
    let teacherProfile = await prisma.teacherProfile.findUnique({
      where: { id: product.creatorId },
      select: {
        id: true,
        user: {
          select: { fullName: true, isFrozen: true, softDeletedAt: true },
        },
      },
    });

    if (!teacherProfile) {
      // Fallback: creatorId might be userId
      teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId: product.creatorId },
        select: {
          id: true,
          user: {
            select: { fullName: true, isFrozen: true, softDeletedAt: true },
          },
        },
      });
    }

    if (teacherProfile?.user?.isFrozen || teacherProfile?.user?.softDeletedAt) {
      return NextResponse.json({ error: 'هذا المنتج غير متاح حالياً.' }, { status: 403 });
    }

    // ── Create ProductOrder in DB (idempotency via UNIQUE submissionToken) ────
    let order;
    try {
      order = await prisma.productOrder.create({
        data: {
          productId: product.id,
          teacherProfileId: teacherProfile?.id ?? null,
          // Snapshots — captured now, immune to future changes
          productTitleSnapshot: product.title,
          productPriceSnapshot: product.priceDZD,
          teacherNameSnapshot: teacherProfile?.user?.fullName ?? product.creatorName,
          formSchemaSnapshot: (product as any).purchaseFormSchema ?? '[]',
          // Buyer info
          firstName: safeFirstName,
          lastName:  safeLastName,
          phone:     safePhone,
          customFields: JSON.stringify(safeCustomFields),
          // Idempotency
          submissionToken: safeToken,
          // Default lifecycle status
          status: 'NEW',
        },
      });
    } catch (err: any) {
      // P2002 = Unique constraint violation (duplicate submissionToken)
      if (err?.code === 'P2002') {
        return NextResponse.json({
          success: true,
          message: 'تم تسجيل طلبك بنجاح. (تم اكتشاف إرسال مكرر وتجاهله)',
        }, { status: 200 });
      }
      throw err;
    }

    if (!order) {
      return NextResponse.json({ error: 'فشل حفظ الطلب. يرجى المحاولة مجدداً.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'تم إرسال طلبك بنجاح! سيتواصل معك الأستاذ قريباً.',
      orderId: order.id,
    });

  } catch (error: any) {
    console.error('[PURCHASE]', error?.message);
    return NextResponse.json({ error: 'حدث خطأ أثناء معالجة الطلب.' }, { status: 500 });
  }
}
