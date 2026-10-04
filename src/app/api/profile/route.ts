import { NextResponse } from 'next/server';
import { getCurrentUser, sanitizeUserForClient } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@/types';
import { validateAlgerianPhone } from '@/lib/algerianPhone';
import { findWilayaCode } from '@/lib/taxonomy';

import { revalidatePath } from 'next/cache';
import { invalidateRankingCache } from '@/lib/ranking';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    return NextResponse.json({ success: true, user: sanitizeUserForClient(user) });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Frozen or soft-deleted accounts cannot modify their profile
    if (user.isFrozen) {
      return NextResponse.json({ error: 'حسابك مجمّد. تواصل مع الإدارة.' }, { status: 403 });
    }
    if (user.softDeletedAt) {
      return NextResponse.json({ error: 'هذا الحساب تم حذفه.' }, { status: 403 });
    }

    const body = await request.json();
    const { fullName, avatarUrl, wilaya } = body;
    const teacherProfile = body.teacherProfile || body;
    const studentProfile = body.studentProfile || body;
    const parentProfile = body.parentProfile || body;
    const institutionProfile = body.institutionProfile || body;

    // Validate and synchronize phone for teacher if provided
    let normalizedPhone: string | undefined = undefined;
    if (user.role === UserRole.TEACHER && teacherProfile.phone !== undefined) {
      if (teacherProfile.phone && teacherProfile.phone.trim()) {
        const phoneVal = validateAlgerianPhone(teacherProfile.phone, false);
        if (!phoneVal.isValid) {
          return NextResponse.json({ error: phoneVal.error }, { status: 400 });
        }
        normalizedPhone = phoneVal.normalizedPhone;

        // Check global uniqueness on User.phone
        const existing = await prisma.user.findFirst({
          where: { phone: normalizedPhone, NOT: { id: user.id } },
        });
        if (existing) {
          return NextResponse.json({ error: 'رقم الهاتف مستخدم من قِبَل حساب آخر.' }, { status: 409 });
        }
      } else {
        normalizedPhone = '';
      }
    }

    let normalizedWhatsapp: string | undefined = undefined;
    if (user.role === UserRole.TEACHER && teacherProfile.whatsapp !== undefined) {
      if (teacherProfile.whatsapp.trim()) {
        const waVal = validateAlgerianPhone(teacherProfile.whatsapp, false);
        if (!waVal.isValid) {
          return NextResponse.json({ error: waVal.error }, { status: 400 });
        }
        normalizedWhatsapp = waVal.normalizedPhone;
      } else {
        normalizedWhatsapp = '';
      }
    }

    const computedWilayaCode = wilaya !== undefined ? findWilayaCode(wilaya) : undefined;

    // Validate subject and education level for teacher profile (if present)
    const { isValidSubjectName, isValidEducationLevelLabel } = await import('@/lib/taxonomy');
    if (teacherProfile.subjects) {
      const subjectsArray = Array.isArray(teacherProfile.subjects)
        ? teacherProfile.subjects
        : typeof teacherProfile.subjects === 'string'
        ? teacherProfile.subjects.split(',').map((s: string) => s.trim())
        : [];
      for (const sub of subjectsArray) {
        if (!isValidSubjectName(sub)) {
          return NextResponse.json({ error: `المادة '${sub}' غير صالحة.` }, { status: 400 });
        }
      }
    }
    if (teacherProfile.educationLevels) {
      const levelsArray = Array.isArray(teacherProfile.educationLevels)
        ? teacherProfile.educationLevels
        : typeof teacherProfile.educationLevels === 'string'
        ? teacherProfile.educationLevels.split(',').map((l: string) => l.trim())
        : [];
      for (const lev of levelsArray) {
        if (!isValidEducationLevelLabel(lev)) {
          return NextResponse.json({ error: `المرحلة التعليمية '${lev}' غير صالحة.` }, { status: 400 });
        }
      }
    }

    // Enforce validated avatar & convert base64 to static uploaded file
    let finalAvatarUrl: string | undefined = undefined;
    if (avatarUrl !== undefined) {
      if (typeof avatarUrl === 'string' && avatarUrl.trim().startsWith('data:image/')) {
        try {
          const matches = avatarUrl.trim().match(/^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/);
          if (matches) {
            let ext = matches[1].toLowerCase();
            if (ext === 'jpeg') ext = 'jpg';
            const allowedExts = ['jpg', 'png', 'webp'];
            if (allowedExts.includes(ext)) {
              const buffer = Buffer.from(matches[2], 'base64');
              if (buffer.length <= 5 * 1024 * 1024) {
                const { storageService } = await import('@/lib/storage/StorageService');
                const uploadRes = await storageService.uploadPublic(buffer, `avatar.${ext}`, 'avatars');
                finalAvatarUrl = uploadRes.url;
              }
            }
          }
        } catch (uploadErr) {
          console.warn('[PROFILE] Failed to convert base64 avatar to file:', uploadErr);
        }
      } else {
        finalAvatarUrl = avatarUrl;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(fullName ? { fullName } : {}),
        ...(finalAvatarUrl !== undefined ? { avatarUrl: finalAvatarUrl } : {}),
        ...(wilaya !== undefined ? { wilaya } : {}),
        ...(computedWilayaCode !== undefined ? { wilayaCode: computedWilayaCode } : {}),
        ...(normalizedPhone !== undefined ? { phone: normalizedPhone || null } : {}),
      },
      include: {
        teacherProfile: true,
        studentProfile: true,
        parentProfile: true,
        institutionProfile: true,
      },
    });

    // Validate qualifications if provided for teacher (max 10 qualifications, length limit)
    let validatedQualifications: string | undefined = undefined;
    if (user.role === UserRole.TEACHER && teacherProfile.qualifications !== undefined) {
      if (Array.isArray(teacherProfile.qualifications)) {
        if (teacherProfile.qualifications.length > 10) {
          return NextResponse.json({ error: 'لا يمكن إضافة أكثر من 10 مؤهلات علمية.' }, { status: 400 });
        }
        const cleaned = teacherProfile.qualifications
          .map((q: any) => String(q).trim())
          .filter(Boolean);
        validatedQualifications = JSON.stringify(cleaned);
      } else if (typeof teacherProfile.qualifications === 'string') {
        const raw = teacherProfile.qualifications.trim();
        if (raw.startsWith('[') && raw.endsWith(']')) {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              if (parsed.length > 10) {
                return NextResponse.json({ error: 'لا يمكن إضافة أكثر من 10 مؤهلات علمية.' }, { status: 400 });
              }
              validatedQualifications = JSON.stringify(parsed.map(q => String(q).trim()).filter(Boolean));
            } else {
              validatedQualifications = raw;
            }
          } catch {
            validatedQualifications = raw;
          }
        } else {
          // Newlines or comma separated string
          const splitItems = raw.split(/[\n,،]/).map((q: string) => q.trim()).filter(Boolean);
          if (splitItems.length > 10) {
            return NextResponse.json({ error: 'لا يمكن إضافة أكثر من 10 مؤهلات علمية.' }, { status: 400 });
          }
          validatedQualifications = raw;
        }
      }
    }

    // Validate and parse priceMin and priceMax for teacher
    let parsedPriceMin: number | null | undefined = undefined;
    if (user.role === UserRole.TEACHER && teacherProfile.priceMin !== undefined) {
      if (teacherProfile.priceMin === '' || teacherProfile.priceMin === null) {
        parsedPriceMin = null;
      } else {
        const val = parseInt(String(teacherProfile.priceMin), 10);
        if (isNaN(val) || val < 0) {
          return NextResponse.json({ error: 'السعر الأدنى غير صالح (يجب أن يكون رقماً موجباً).' }, { status: 400 });
        }
        parsedPriceMin = val;
      }
    }

    let parsedPriceMax: number | null | undefined = undefined;
    if (user.role === UserRole.TEACHER && teacherProfile.priceMax !== undefined) {
      if (teacherProfile.priceMax === '' || teacherProfile.priceMax === null) {
        parsedPriceMax = null;
      } else {
        const val = parseInt(String(teacherProfile.priceMax), 10);
        if (isNaN(val) || val < 0) {
          return NextResponse.json({ error: 'السعر الأقصى غير صالح (يجب أن يكون رقماً موجباً).' }, { status: 400 });
        }
        parsedPriceMax = val;
      }
    }

    if (parsedPriceMin !== null && parsedPriceMin !== undefined && parsedPriceMax !== null && parsedPriceMax !== undefined) {
      if (parsedPriceMin > parsedPriceMax) {
        return NextResponse.json({ error: 'السعر الأدنى لا يمكن أن يتجاوز السعر الأقصى.' }, { status: 400 });
      }
    }

    // Normalize teaching mode (HYBRID -> BOTH)
    let normalizedTeachingMode: string | undefined = undefined;
    if (user.role === UserRole.TEACHER && teacherProfile.teachingMode) {
      normalizedTeachingMode = teacherProfile.teachingMode === 'HYBRID' ? 'BOTH' : teacherProfile.teachingMode;
    }

    // Validate website URL if provided
    let validatedWebsite: string | null | undefined = undefined;
    if (user.role === UserRole.TEACHER && teacherProfile.website !== undefined) {
      if (!teacherProfile.website || !teacherProfile.website.trim()) {
        validatedWebsite = null;
      } else {
        const ws = teacherProfile.website.trim();
        if (!/^https?:\/\//i.test(ws)) {
          return NextResponse.json({ error: 'رابط الموقع يجب أن يبدأ بـ https:// أو http://' }, { status: 400 });
        }
        if (/javascript:|data:|vbscript:/i.test(ws)) {
          return NextResponse.json({ error: 'رابط الموقع غير مقبول.' }, { status: 400 });
        }
        if (ws.length > 500) {
          return NextResponse.json({ error: 'رابط الموقع طويل جداً.' }, { status: 400 });
        }
        validatedWebsite = ws;
      }
    }

    // Update role profile if present
    if (user.role === UserRole.TEACHER && updatedUser.teacherProfile) {
      await prisma.teacherProfile.update({
        where: { id: updatedUser.teacherProfile.id },
        data: {
          ...(teacherProfile.headline !== undefined ? { headline: teacherProfile.headline } : {}),
          ...(teacherProfile.bio !== undefined ? { bio: teacherProfile.bio } : {}),
          ...(teacherProfile.subjects ? { subjects: typeof teacherProfile.subjects === 'string' ? teacherProfile.subjects : JSON.stringify(teacherProfile.subjects) } : {}),
          ...(teacherProfile.educationLevels ? { educationLevels: typeof teacherProfile.educationLevels === 'string' ? teacherProfile.educationLevels : JSON.stringify(teacherProfile.educationLevels) } : {}),
          ...(normalizedTeachingMode ? { teachingMode: normalizedTeachingMode } : {}),
          ...(teacherProfile.experienceYears !== undefined ? { experienceYears: parseInt(teacherProfile.experienceYears, 10) || 0 } : {}),
          ...(validatedQualifications !== undefined ? { qualifications: validatedQualifications } : {}),
          ...(teacherProfile.pricingInfo !== undefined ? { pricingInfo: teacherProfile.pricingInfo } : {}),
          ...(parsedPriceMin !== undefined ? { priceMin: parsedPriceMin } : {}),
          ...(parsedPriceMax !== undefined ? { priceMax: parsedPriceMax } : {}),
          ...(teacherProfile.availability !== undefined ? { availability: teacherProfile.availability } : {}),
          ...(normalizedPhone !== undefined ? { phone: normalizedPhone } : {}),
          ...(normalizedWhatsapp !== undefined ? { whatsapp: normalizedWhatsapp } : {}),
          ...(teacherProfile.telegram !== undefined ? { telegram: teacherProfile.telegram } : {}),
          ...(teacherProfile.instagram !== undefined ? { instagram: teacherProfile.instagram } : {}),
          ...(teacherProfile.facebook !== undefined ? { facebook: teacherProfile.facebook } : {}),
          ...(teacherProfile.storeLocation !== undefined ? { storeLocation: typeof teacherProfile.storeLocation === 'string' ? teacherProfile.storeLocation.trim() : null } : {}),
          ...(validatedWebsite !== undefined ? { website: validatedWebsite } : {}),
        },
      });
    } else if (user.role === UserRole.STUDENT && updatedUser.studentProfile) {
      await prisma.studentProfile.update({
        where: { id: updatedUser.studentProfile.id },
        data: {
          ...(studentProfile.educationLevel !== undefined ? { educationLevel: studentProfile.educationLevel } : {}),
          ...(studentProfile.interests ? { interests: typeof studentProfile.interests === 'string' ? studentProfile.interests : JSON.stringify(studentProfile.interests) } : {}),
        },
      });
    } else if (user.role === UserRole.PARENT && updatedUser.parentProfile) {
      await prisma.parentProfile.update({
        where: { id: updatedUser.parentProfile.id },
        data: {
          ...(parentProfile.budgetRange !== undefined ? { budgetRange: parentProfile.budgetRange } : {}),
        },
      });
    } else if (user.role === UserRole.INSTITUTION && updatedUser.institutionProfile) {
      await prisma.institutionProfile.update({
        where: { id: updatedUser.institutionProfile.id },
        data: {
          ...(institutionProfile.name !== undefined ? { name: institutionProfile.name } : {}),
          ...(institutionProfile.description !== undefined ? { description: institutionProfile.description } : {}),
          ...(institutionProfile.address !== undefined ? { address: institutionProfile.address } : {}),
          ...(institutionProfile.phone !== undefined ? { phone: institutionProfile.phone } : {}),
          ...(institutionProfile.website !== undefined ? { website: institutionProfile.website } : {}),
        },
      });
    }

    const refreshedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        teacherProfile: true,
        studentProfile: true,
        parentProfile: true,
        institutionProfile: true,
      },
    });

    if (!refreshedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Invalidate caches when profile is updated
    if (user.role === UserRole.TEACHER) {
      invalidateRankingCache();
      revalidatePath('/teachers');
      revalidatePath('/');
      revalidatePath('/dashboard/teacher');
      if (refreshedUser.teacherProfile?.id) {
        revalidatePath(`/teachers/${refreshedUser.teacherProfile.id}`);
      }
    } else if (user.role === UserRole.STUDENT) {
      revalidatePath('/dashboard/student');
    } else if (user.role === UserRole.PARENT) {
      revalidatePath('/dashboard/parent');
    }

    return NextResponse.json({ success: true, user: sanitizeUserForClient(refreshedUser) });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  return PATCH(request);
}
