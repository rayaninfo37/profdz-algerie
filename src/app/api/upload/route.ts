import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/middleware/rateLimitMiddleware';
import { storageService } from '@/lib/storage/StorageService';
import { KRYTY_CONFIG } from '@/lib/config';

export async function POST(request: Request) {
  const limitRes = await rateLimit(request, 20);
  if (limitRes) return limitRes;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول لرفع الملفات' }, { status: 401 });
    }

    if (user.isFrozen) {
      return NextResponse.json({ error: 'حسابك مجمّد. تواصل مع الإدارة.' }, { status: 403 });
    }
    if (user.softDeletedAt) {
      return NextResponse.json({ error: 'هذا الحساب تم حذفه.' }, { status: 403 });
    }

    const form = await request.formData();
    const file = form.get('file') as File;
    const category = (form.get('category') as string) || (form.get('type') as string) || 'avatars';
    const isPrivate = form.get('isPrivate') === 'true' || ['verification', 'receipts'].includes(category);

    if (!file) {
      return NextResponse.json({ error: 'لم يتم تزويد أي ملف للرفع' }, { status: 400 });
    }

    // Sanitize filename to prevent path traversal attacks
    const rawName = file.name || 'upload';
    const sanitizedName = rawName
      .replace(/[/\\:*?"<>|\x00-\x1f]/g, '_')  // Remove path separators, null bytes, special chars
      .replace(/\.\./g, '_')                      // Prevent directory traversal
      .replace(/^\.+/, '_')                        // Prevent hidden files
      .slice(0, 200);                              // Limit filename length

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Private uploads: Payment receipts (CCP / BaridiMob)
    if (isPrivate) {
      if (buffer.length > KRYTY_CONFIG.uploadLimits.maxPrivateReceiptSizeBytes) {
        return NextResponse.json({
          error: `حجم المستند يتجاوز الحد الأقصى (${KRYTY_CONFIG.uploadLimits.maxPrivateReceiptSizeMB} ميغابايت).`,
        }, { status: 400 });
      }

      const result = await storageService.uploadPrivate(buffer, sanitizedName, user.id, 'receipts');
      const docRecordId = result.fileId;

      return NextResponse.json({
        success: true,
        isPrivate: true,
        documentId: docRecordId,
        documentUrl: `/api/documents/${docRecordId}`,
        storagePath: result.storagePath,
        fileName: result.fileName,
        fileSize: result.fileSize,
      });
    }

    // Public uploads: avatars, posts, products, videos
    let maxAllowedBytes = KRYTY_CONFIG.uploadLimits.maxPostImageSizeBytes;
    let targetCategory: 'avatars' | 'posts' | 'products' | 'videos' = 'posts';

    // Special category: Admin Local Video for About Page
    if (category === 'about-video' || category === 'videos') {
      if (user.role !== 'ADMIN') {
        return NextResponse.json({
          error: 'فقط مسؤولو المنصة (Admin) يملكون صلاحية رفع الفيديو التعريفي للمنصة.',
        }, { status: 403 });
      }

      const isVideo = file.type === 'video/mp4' || file.type === 'video/webm' || file.type.startsWith('video/');
      if (!isVideo) {
        return NextResponse.json({
          error: 'صيغة الملف غير صالحة كفيديو. يُسمح فقط بملفات MP4 أو WebM.',
        }, { status: 400 });
      }

      const MAX_ABOUT_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB
      if (buffer.length > MAX_ABOUT_VIDEO_BYTES) {
        return NextResponse.json({
          error: 'حجم ملف الفيديو يتجاوز الحد الأقصى المسموح به (50 ميغابايت).',
        }, { status: 400 });
      }

      targetCategory = 'videos';
      const publicResult = await storageService.uploadPublic(buffer, sanitizedName, targetCategory);

      return NextResponse.json({
        success: true,
        url: publicResult.url,
        fileName: publicResult.fileName,
        size: publicResult.fileSize,
        mimeType: publicResult.mimeType,
      });
    }

    // Enforce IMAGES ONLY policy for standard user uploads: strictly reject any video file upload
    if (file.type.startsWith('video/') || category === 'product-video') {
      return NextResponse.json({
        error: 'منصة قراتي مخصصة للصور والمستندات التعليمية فقط (Images & PDF Only). رفع مقاطع الفيديو غير مدعوم للمستخدمين العاديين.',
      }, { status: 400 });
    }

    if (category === 'avatars' || form.get('isAvatar') === 'true') {
      targetCategory = 'avatars';
      // Strict requirement: Student image limit = 1MB (1024 * 1024 bytes)
      const isStudent = user.role === 'STUDENT' || user.activeRole === 'STUDENT' || user.studentProfile;
      maxAllowedBytes = isStudent ? 1 * 1024 * 1024 : KRYTY_CONFIG.uploadLimits.maxAvatarSizeBytes;
    } else if (category === 'products' || category.startsWith('product-')) {
      targetCategory = 'products';
      if (category === 'product-cover') {
        maxAllowedBytes = KRYTY_CONFIG.productMedia.maxCoverSizeBytes; // 10 MB
      } else if (category === 'product-gallery') {
        maxAllowedBytes = KRYTY_CONFIG.productMedia.maxGalleryTotalSizeBytes; // 30 MB
      } else {
        maxAllowedBytes = KRYTY_CONFIG.uploadLimits.maxProductPreviewImageSizeBytes;
      }
    } else if (category === 'posts') {
      targetCategory = 'posts';
      const isStudentOrParent = user.role === 'STUDENT' || user.role === 'PARENT';
      // Community post images for Students & Parents capped at max 1MB
      maxAllowedBytes = isStudentOrParent ? 1 * 1024 * 1024 : KRYTY_CONFIG.uploadLimits.maxPostImageSizeBytes;
    }

    if (buffer.length > maxAllowedBytes) {
      const isStudent = (category === 'avatars' || form.get('isAvatar') === 'true') && (user.role === 'STUDENT' || user.activeRole === 'STUDENT' || user.studentProfile);
      const limitText = isStudent ? '1 ميغابايت' : `${Math.round(maxAllowedBytes / (1024 * 1024))} ميغابايت`;
      return NextResponse.json({
        error: `حجم الصورة يتجاوز الحد الأقصى المسموح به (${limitText}). يرجى اختيار صورة أصغر حجماً.`,
      }, { status: 400 });
    }

    const publicResult = await storageService.uploadPublic(buffer, sanitizedName, targetCategory);

    // If avatar upload, update user profile avatarUrl immediately
    if (targetCategory === 'avatars') {
      await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl: publicResult.url },
      });
    }

    return NextResponse.json({
      success: true,
      url: publicResult.url,
      fileName: publicResult.fileName,
      size: publicResult.fileSize,
      mimeType: publicResult.mimeType,
    });
  } catch (error: any) {
    console.error('Secure upload error:', error);
    return NextResponse.json({
      error: error.message || 'فشل في رفع ومعالجة الملف. يرجى التأكد من صحة الملف.',
    }, { status: 500 });
  }
}
