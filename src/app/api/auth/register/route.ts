import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, signToken, setSessionCookie, sanitizeUserForClient } from '@/lib/auth';
import { UserRole, SubscriptionState, TeachingMode, ProfessionalTitle, StudentType } from '@/types';
import { rateLimit } from '@/middleware/rateLimitMiddleware';
import { validateAlgerianPhone } from '@/lib/algerianPhone';
import { findWilayaCode } from '@/lib/taxonomy';
import { logAnalyticsEvent } from '@/lib/analytics';

import crypto from 'crypto';

export async function POST(request: Request) {
  const limitRes = await rateLimit(request);
  if (limitRes) return limitRes;
  try {
    const body = await request.json();
    const { email, password, fullName, role, wilaya, termsAccepted, avatarUrl, details } = body;

    if (!email || !password || !fullName || !role) {
      return NextResponse.json({ error: 'يرجى ملء جميع الحقول الإلزامية للتسجيل.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.' }, { status: 400 });
    }
    const hasNumberOrSpecial = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    if (!hasNumberOrSpecial) {
      return NextResponse.json({
        error: 'كلمة المرور يجب أن تحتوي على رقم أو رمز خاص على الأقل (مثال: 1، @، #).',
      }, { status: 400 });
    }

    // Mandatory Terms & Privacy Policy consent enforcement
    if (termsAccepted !== true) {
      return NextResponse.json({
        error: 'يجب الموافقة على شروط الاستخدام وسياسة الخصوصية للمتابعة.',
      }, { status: 400 });
    }

    // Strict Public Role Whitelist (Prevent Role Injection / Privilege Escalation to ADMIN or unapproved roles)
    const ALLOWED_REGISTER_ROLES = [UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT];
    if (!ALLOWED_REGISTER_ROLES.includes(role as UserRole)) {
      return NextResponse.json({
        error: 'الدور المحدد غير صالح للتسجيل العام. يرجى اختيار دور أستاذ أو تلميذ أو ولي أمر.',
      }, { status: 400 });
    }

    // Phone validation & normalization (Mandatory for ALL roles: TEACHER, STUDENT, PARENT)
    const rawPhone = details?.phone || body.phone;
    if (!rawPhone || !String(rawPhone).trim()) {
      return NextResponse.json({ error: 'رقم الهاتف الجزائري إلزامي لجميع الحسابات (10 أرقام).' }, { status: 400 });
    }

    const phoneValidation = validateAlgerianPhone(rawPhone, true);
    if (!phoneValidation.isValid) {
      return NextResponse.json({ error: phoneValidation.error }, { status: 400 });
    }
    const normalizedPhone = phoneValidation.normalizedPhone;
    const normalizedEmail = email.toLowerCase().trim();

    // Ensure phone uniqueness across all users & teacher profiles (Global Uniqueness)
    const existingPhoneUser = await prisma.user.findFirst({
      where: { phone: normalizedPhone },
    });
    const existingTeacherPhone = await prisma.teacherProfile.findFirst({
      where: { phone: normalizedPhone },
    });

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser && (existingPhoneUser || existingTeacherPhone)) {
      return NextResponse.json({ error: 'البريد الإلكتروني ورقم الهاتف مسجلان مسبقاً بحساب آخر.' }, { status: 400 });
    }
    if (existingUser) {
      return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل بحساب آخر.' }, { status: 400 });
    }
    if (existingPhoneUser || existingTeacherPhone) {
      return NextResponse.json({ error: 'رقم الهاتف مسجل مسبقاً في حساب آخر.' }, { status: 400 });
    }

    if (!avatarUrl || typeof avatarUrl !== 'string' || !avatarUrl.trim()) {
      return NextResponse.json({
        error: 'الصورة الشخصية مطلوبة لإنشاء الحساب.',
      }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const userRole = role as UserRole;
    const wilayaCode = findWilayaCode(wilaya);

    // Enforce validated avatar & convert base64 to static uploaded file
    let finalAvatarUrl = avatarUrl.trim();
    if (finalAvatarUrl.startsWith('data:image/')) {
      try {
        const matches = finalAvatarUrl.match(/^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/);
        if (matches) {
          let ext = matches[1].toLowerCase();
          if (ext === 'jpeg') ext = 'jpg';
          const buffer = Buffer.from(matches[2], 'base64');
          if (buffer.length <= 5 * 1024 * 1024) {
            const { storageService } = await import('@/lib/storage/StorageService');
            const uploadRes = await storageService.uploadPublic(buffer, `avatar.${ext}`, 'avatars');
            finalAvatarUrl = uploadRes.url;
          }
        }
      } catch (uploadErr) {
        console.warn('[REGISTER] Failed to convert base64 avatar to file:', uploadErr);
      }
    }

    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        fullName,
        phone: normalizedPhone,
        role: userRole,
        wilaya: wilaya || null,
        wilayaCode: wilayaCode || null,
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        avatarUrl: finalAvatarUrl,
        isEmailVerified: false,
        isPhoneVerified: false,
        // emailVerifiedAt omitted until verification
      },
    });

    // Create role-specific profile
    if (userRole === UserRole.TEACHER) {
      const inputTitle = details?.professionalTitle || body.professionalTitle;
      const validTitles = Object.values(ProfessionalTitle);
      const title = validTitles.includes(inputTitle)
        ? inputTitle
        : ProfessionalTitle.PROFESSOR;

      let regPriceMin: number | null = null;
      let regPriceMax: number | null = null;
      const rawPriceMin = details?.priceMin !== undefined ? details.priceMin : body.priceMin;
      const rawPriceMax = details?.priceMax !== undefined ? details.priceMax : body.priceMax;
      if (rawPriceMin !== undefined && rawPriceMin !== null && rawPriceMin !== '') {
        const p = parseInt(String(rawPriceMin), 10);
        if (!isNaN(p) && p >= 0) regPriceMin = p;
      }
      if (rawPriceMax !== undefined && rawPriceMax !== null && rawPriceMax !== '') {
        const p = parseInt(String(rawPriceMax), 10);
        if (!isNaN(p) && p >= 0) regPriceMax = p;
      }
      if (regPriceMin !== null && regPriceMax !== null && regPriceMin > regPriceMax) {
        const tmp = regPriceMin;
        regPriceMin = regPriceMax;
        regPriceMax = tmp;
      }

      await prisma.teacherProfile.create({
        data: {
          userId: newUser.id,
          professionalTitle: title,
          headline: details?.headline || body.headline || 'أستاذ تعليمي معتمد',
          bio: details?.bio || body.bio || '',
          subjects: JSON.stringify(details?.subjects || body.subjects || ['الرياضيات']),
          educationLevels: JSON.stringify(details?.educationLevels || body.educationLevels || ['البكالوريا (BAC)']),
          teachingMode: details?.teachingMode || body.teachingMode || TeachingMode.BOTH,
          experienceYears: details?.experienceYears ? parseInt(details.experienceYears, 10) : (body.experienceYears ? parseInt(body.experienceYears, 10) : 1),
          qualifications: details?.qualifications || body.qualifications || '',
          priceMin: regPriceMin,
          priceMax: regPriceMax,
          phone: normalizedPhone || '',
          whatsapp: details?.whatsapp ? validateAlgerianPhone(details.whatsapp).normalizedPhone : (body.whatsapp ? validateAlgerianPhone(body.whatsapp).normalizedPhone : ''),
          telegram: details?.telegram || body.telegram || '',
          subscriptionState: SubscriptionState.FREE_ACTIVE,
        },
      });
    } else if (userRole === UserRole.STUDENT) {
      const inputType = details?.studentType || body.studentType;
      const validStudentTypes = Object.values(StudentType);
      const sType = validStudentTypes.includes(inputType)
        ? inputType
        : StudentType.PUPIL_SECONDARY;

      // Derive default education level directly from selected studentType if raw educationLevel was not specified
      const TYPE_TO_LEVEL: Record<string, string> = {
        [StudentType.PUPIL_PRIMARY]: 'PRIMARY',
        [StudentType.PUPIL_MIDDLE]: 'MIDDLE',
        [StudentType.PUPIL_SECONDARY]: 'SECONDARY',
        [StudentType.UNIVERSITY]: 'UNIVERSITY',
      };

      // Normalize educationLevel: accept enum value OR Arabic display label
      const rawEdLevel = details?.educationLevel || body.educationLevel || '';
      const EDU_MAP: Record<string, string> = {
        // Arabic display → enum (stable)
        'ابتدائي': 'PRIMARY',
        'متوسط': 'MIDDLE',
        'ثانوي': 'SECONDARY',
        'جامعي': 'UNIVERSITY',
        // Already-enum pass-through
        'PRIMARY': 'PRIMARY',
        'MIDDLE': 'MIDDLE',
        'SECONDARY': 'SECONDARY',
        'UNIVERSITY': 'UNIVERSITY',
        // Legacy label format pass-through
        'البكالوريا (BAC)': 'SECONDARY',
        'BAC Prep (البكالوريا)': 'SECONDARY',
      };
      const fallbackFromType = TYPE_TO_LEVEL[sType] || 'SECONDARY';
      const normalizedEdLevel = EDU_MAP[rawEdLevel] || (rawEdLevel ? rawEdLevel : fallbackFromType);

      await prisma.studentProfile.create({
        data: {
          userId: newUser.id,
          studentType: sType,
          educationLevel: normalizedEdLevel,
          interests: JSON.stringify(details?.interests || body.interests || []),
        },
      });
    } else if (userRole === UserRole.PARENT) {
      await prisma.parentProfile.create({
        data: {
          userId: newUser.id,
          budgetRange: details?.budgetRange || body.budgetRange || 'متوسط',
        },
      });
    } else if (userRole === UserRole.INSTITUTION) {
      const instName = details?.name || body.institutionName || fullName;
      await prisma.institutionProfile.create({
        data: {
          userId: newUser.id,
          name: instName,
          logo: finalAvatarUrl,
          description: details?.description || body.description || '',
          address: details?.address || body.address || wilaya || '',
          phone: normalizedPhone || '',
          website: details?.website || body.website || '',
          isVerified: false,
        },
      });
    }

    // Workstream 14: Real email ownership verification token creation
    try {
      const rawVerifyToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawVerifyToken).digest('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await prisma.emailVerificationToken.create({
        data: {
          email: newUser.email,
          tokenHash,
          expiresAt,
        },
      });

      const verifyUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000') + '/verify-email?token=' + rawVerifyToken;
      try {
        const { sendEmail } = await import('@/lib/emailService');
        await sendEmail({
          to: newUser.email,
          subject: 'تأكيد بريدك الإلكتروني — PROF DZ',
          html: '<div dir="rtl"><h2>مرحباً بك في PROF DZ!</h2><p>اضغط على الرابط لتأكيد بريدك (صالح 24 ساعة): <a href="' + verifyUrl + '">تأكيد البريد الإلكتروني</a></p></div>',
        });
      } catch (emailErr) {
        console.error('[EMAIL] Failed to send verification email on register:', emailErr);
        // Log fallback for development
        if (process.env.NODE_ENV !== 'production') {
          console.log('[EMAIL_VERIFICATION] Verify URL:', verifyUrl);
        }
      }
    } catch (e) {
      console.error('Failed to create verification token on register:', e);
    }

    // Requirement 12: Generate phone verification code for TEACHER
    if (userRole === 'TEACHER' && normalizedPhone) {
      try {
        const phoneCode = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit code
        const phoneCodeHash = crypto.createHash('sha256').update(phoneCode).digest('hex');
        const phoneExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        await prisma.phoneVerificationCode.create({
          data: {
            userId: newUser.id,
            phone: normalizedPhone,
            code: phoneCodeHash, // store hash, never plaintext
            expiresAt: phoneExpires,
          },
        });

        if (process.env.NODE_ENV !== 'production') {
          console.log(`[PHONE_VERIFICATION] Teacher ${newUser.email} phone ${normalizedPhone} code: ${phoneCode}`);
        }
      } catch (e) {
        console.error('Failed to create phone verification code:', e);
      }
    }


    // Automatically establish session for all registered users including teachers
    const token = await signToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role as UserRole,
      fullName: newUser.fullName,
    });

    await setSessionCookie(token);

    // Analytics: track successful registration
    logAnalyticsEvent({ type: 'REGISTER', userId: newUser.id, metadata: { role: userRole } });

    const fullUser = await prisma.user.findUnique({
      where: { id: newUser.id },
      include: {
        teacherProfile: true,
        studentProfile: true,
        parentProfile: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: sanitizeUserForClient(fullUser || newUser),
    });
  } catch (error: any) {
    console.error('Registration Error:', error);
    if (error?.code === 'P2002') {
      const target = error.meta?.target;
      if (Array.isArray(target) && target.includes('phone')) {
        return NextResponse.json({ error: 'رقم الهاتف مسجل مسبقاً في حساب آخر.' }, { status: 400 });
      }
      if (Array.isArray(target) && target.includes('email')) {
        return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل بحساب آخر.' }, { status: 400 });
      }
      return NextResponse.json({ error: 'البريد الإلكتروني أو رقم الهاتف مسجل مسبقاً.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة لاحقاً.' }, { status: 500 });
  }
}
