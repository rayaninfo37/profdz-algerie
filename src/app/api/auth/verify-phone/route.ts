import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/middleware/rateLimitMiddleware';
import { validateAlgerianPhone } from '@/lib/algerianPhone';
import crypto from 'crypto';

export async function POST(request: Request) {
  const limitRes = await rateLimit(request);
  if (limitRes) return limitRes;
  try {
    const body = await request.json().catch(() => ({}));
    const { phone, code, email } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'رمز التحقق مطلوب.' }, { status: 400 });
    }

    // Hash the incoming code to compare against stored hash
    const codeHash = crypto.createHash('sha256').update(code.trim()).digest('hex');

    let normalizedPhone: string | null = null;
    if (phone) {
      const phoneValidation = validateAlgerianPhone(phone, false);
      if (phoneValidation.isValid) {
        normalizedPhone = phoneValidation.normalizedPhone;
      }
    }

    // Find the verification record (code stored as SHA-256 hash)
    const whereClause: any = {
      code: codeHash,
      verified: false,
      expiresAt: { gte: new Date() },
    };

    if (normalizedPhone) {
      whereClause.phone = normalizedPhone;
    }

    let record = await prisma.phoneVerificationCode.findFirst({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    // Fallback: if user specified email and no phone matched
    if (!record && email) {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });
      if (user) {
        record = await prisma.phoneVerificationCode.findFirst({
          where: {
            userId: user.id,
            code: codeHash,
            verified: false,
            expiresAt: { gte: new Date() },
          },
          orderBy: { createdAt: 'desc' },
        });
      }
    }

    if (!record) {
      return NextResponse.json({ error: 'رمز تأكيد الهاتف غير صحيح أو منتهي الصلاحية.' }, { status: 400 });
    }

    // Mark verification code as verified
    await prisma.phoneVerificationCode.update({
      where: { id: record.id },
      data: { verified: true },
    });

    // Update user's isPhoneVerified flag
    await prisma.user.update({
      where: { id: record.userId },
      data: { isPhoneVerified: true },
    });

    return NextResponse.json({
      success: true,
      message: 'تم تأكيد رقم الهاتف بنجاح.',
    });
  } catch (error: any) {
    console.error('Phone verification error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تأكيد رقم الهاتف.' }, { status: 500 });
  }
}
