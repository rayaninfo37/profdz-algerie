import path from 'path';
import crypto from 'crypto';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { KRYTY_CONFIG } from '@/lib/config';

export interface PublicUploadResult {
  url: string;
  storagePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface PrivateUploadResult {
  fileId: string;
  storagePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface IStorageService {
  uploadPublic(
    buffer: Buffer,
    originalName: string,
    category: 'avatars' | 'posts' | 'products' | 'videos'
  ): Promise<PublicUploadResult>;

  uploadPrivate(
    buffer: Buffer,
    originalName: string,
    userId: string,
    category: 'receipts'
  ): Promise<PrivateUploadResult>;

  readPrivateFile(storagePath: string): Promise<Buffer>;
}

/**
 * Validate file signatures (magic bytes) to prevent extension/MIME spoofing
 */
export function validateFileSignature(buffer: Buffer): { valid: boolean; detectedMime?: string } {
  if (!buffer || buffer.length < 4) {
    return { valid: false };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, detectedMime: 'image/jpeg' };
  }

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { valid: true, detectedMime: 'image/png' };
  }

  // PDF: 25 50 44 46 (%PDF)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return { valid: true, detectedMime: 'application/pdf' };
  }

  // WebP: 52 49 46 46 .... 57 45 42 50 (RIFF....WEBP)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return { valid: true, detectedMime: 'image/webp' };
  }

  // WebM: 1A 45 DF A3
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3
  ) {
    return { valid: true, detectedMime: 'video/webm' };
  }

  // MP4: bytes 4-7 are 'ftyp'
  if (
    buffer.length >= 12 &&
    buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70
  ) {
    return { valid: true, detectedMime: 'video/mp4' };
  }

  return { valid: false };
}

export class LocalStorageAdapter implements IStorageService {
  private publicBaseDir: string;
  private privateBaseDir: string;

  constructor() {
    this.publicBaseDir = path.join(process.cwd(), 'public', 'uploads', 'public');
    this.privateBaseDir = path.join(process.cwd(), 'storage', 'private');
  }

  async uploadPublic(
    buffer: Buffer,
    originalName: string,
    category: 'avatars' | 'posts' | 'products' | 'videos'
  ): Promise<PublicUploadResult> {
    const sig = validateFileSignature(buffer);
    if (!sig.valid || !sig.detectedMime) {
      throw new Error('نوع الملف غير مدعوم أو تالف.');
    }

    if (category === 'videos') {
      if (!sig.detectedMime.startsWith('video/')) {
        throw new Error('الملف ليس فيديو صالحاً. يُسمح فقط بصيغ MP4 أو WebM.');
      }
    } else {
      if (sig.detectedMime.startsWith('video/')) {
        throw new Error('نوع الملف غير مدعوم. يُسمح فقط بملفات الصور (JPEG أو PNG أو WebP).');
      }
    }

    const ext = path.extname(originalName).toLowerCase() || (category === 'videos' ? '.mp4' : '.png');
    const safeExt = category === 'videos'
      ? (['.mp4', '.webm'].includes(ext) ? ext : (sig.detectedMime === 'video/webm' ? '.webm' : '.mp4'))
      : (['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.png');
    const randomName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExt}`;

    const targetDir = path.join(this.publicBaseDir, category);
    await mkdir(targetDir, { recursive: true });

    const targetPath = path.join(targetDir, randomName);
    await writeFile(targetPath, buffer);

    const publicUrl = `/uploads/public/${category}/${randomName}`;

    return {
      url: publicUrl,
      storagePath: targetPath,
      fileName: path.basename(originalName),
      fileSize: buffer.length,
      mimeType: sig.detectedMime,
    };
  }

  async uploadPrivate(
    buffer: Buffer,
    originalName: string,
    userId: string,
    category: 'verification' | 'receipts'
  ): Promise<PrivateUploadResult> {
    const sig = validateFileSignature(buffer);
    if (!sig.valid || !sig.detectedMime) {
      throw new Error('نوع الملف غير مدعوم. للمستندات الخاصة يُسمح فقط بصيغ PDF أو JPEG أو PNG.');
    }

    // Strict extension check for private documents (PDF, JPEG, PNG only)
    const allowedPrivateMimes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedPrivateMimes.includes(sig.detectedMime)) {
      throw new Error('الملف غير صالح كمستند رسمي. يُسمح فقط بملفات PDF أو صور JPG/PNG.');
    }

    const ext = path.extname(originalName).toLowerCase() || '.pdf';
    const safeExt = ['.pdf', '.jpg', '.jpeg', '.png'].includes(ext) ? ext : '.pdf';
    const fileId = crypto.randomUUID();
    const storedFileName = `${fileId}${safeExt}`;

    // Fail closed: Ensure private directory exists outside web root
    const userPrivateDir = path.join(this.privateBaseDir, userId, category);
    try {
      await mkdir(userPrivateDir, { recursive: true });
    } catch (err) {
      console.error('Fatal: Failed to create private storage directory:', err);
      throw new Error('فشل تأمين مسار التخزين الخاص. تم إلغاء الرفع لحماية خصوصية بياناتك.');
    }

    const fullFilePath = path.join(userPrivateDir, storedFileName);
    await writeFile(fullFilePath, buffer);

    // Store relative path (forward-slash normalized) to prevent OS-specific path leaks
    const relativeStoragePath = `${userId}/${category}/${storedFileName}`;

    return {
      fileId,
      storagePath: relativeStoragePath,
      fileName: path.basename(originalName),
      fileSize: buffer.length,
      mimeType: sig.detectedMime,
    };
  }

  async readPrivateFile(storagePath: string): Promise<Buffer> {
    // Support both relative storage path (userId/category/file) and legacy absolute paths
    const fullPath = path.isAbsolute(storagePath)
      ? path.normalize(storagePath)
      : path.join(this.privateBaseDir, storagePath);

    const normalized = path.normalize(fullPath);
    // Prevent path traversal outside storage/private
    if (!normalized.startsWith(this.privateBaseDir)) {
      throw new Error('Forbidden: Invalid storage path traversal detected.');
    }

    if (!existsSync(normalized)) {
      throw new Error('File not found in storage.');
    }

    return await readFile(normalized);
  }
}

export const storageService = new LocalStorageAdapter();
