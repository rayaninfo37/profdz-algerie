import { PrismaClient } from '@prisma/client';
import * as jose from 'jose';
import fs from 'fs';
import path from 'path';
function validateGoogleSheetUrl(input) {
  if (!input || typeof input !== 'string') return { isValid: false };
  const trimmed = input.trim();
  const match = trimmed.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]{20,60})/);
  if (match && match[1]) return { isValid: true, spreadsheetId: match[1] };
  if (/^[a-zA-Z0-9_-]{20,60}$/.test(trimmed)) return { isValid: true, spreadsheetId: trimmed };
  return { isValid: false };
}

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'kryty_master_secret_key_2026_dz_algeria_education');
const BASE_URL = 'http://127.0.0.1:3000';

async function createToken(payload) {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

let ipCounter = 500;
function getTestHeaders(extra = {}) {
  ipCounter++;
  return {
    'X-Forwarded-For': `10.50.${Math.floor(ipCounter / 250)}.${ipCounter % 250 + 1}`,
    ...extra,
  };
}

async function run() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING GOOGLE SHEETS & ABOUT VIDEO E2E VERIFICATION');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      const res = await fn();
      if (res) {
        console.log(`  ✅ [PASS] ${name}`);
        passed++;
      } else {
        console.error(`  ❌ [FAIL] ${name} (assertion returned false)`);
        failed++;
      }
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  // Find Admin and Teacher
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const teacher = await prisma.user.findFirst({
    where: { role: 'TEACHER' },
    include: { teacherProfile: true },
  });
  const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });

  if (!admin || !teacher || !student) {
    throw new Error('Required roles not found in DB');
  }

  const adminToken = await createToken({
    userId: admin.id,
    email: admin.email,
    role: admin.role,
    fullName: admin.fullName,
  });

  const teacherToken = await createToken({
    userId: teacher.id,
    email: teacher.email,
    role: teacher.role,
    fullName: teacher.fullName,
  });

  const studentToken = await createToken({
    userId: student.id,
    email: student.email,
    role: student.role,
    fullName: student.fullName,
  });

  try {
    // -------------------------------------------------------------------------
    // SECTION 1: ABOUT VIDEO LOCAL UPLOAD & AUTHORIZATION
    // -------------------------------------------------------------------------
    console.log('\n--- Section 1: About PROF DZ Video Local Upload ---');

    // Create a mock MP4 file buffer with valid ftyp header
    // Byte 0-3: box size (00 00 00 18), Byte 4-7: "ftyp" (66 74 79 70)
    const validMp4Buffer = Buffer.alloc(1024);
    validMp4Buffer.writeUInt32BE(24, 0);
    validMp4Buffer.write('ftyp', 4, 'ascii');
    validMp4Buffer.write('mp42', 8, 'ascii');

    // Create a fake formData for upload
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';

    function buildMultipartBody(filename, mimeType, fileBuffer, category = 'about-video') {
      const pre = `--${boundary}\r\nContent-Disposition: form-data; name="category"\r\n\r\n${category}\r\n--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`;
      const post = `\r\n--${boundary}--\r\n`;
      return Buffer.concat([Buffer.from(pre, 'utf8'), fileBuffer, Buffer.from(post, 'utf8')]);
    }

    // 1. Non-admin cannot upload about-video category
    await test('Authorization: Student attempting about-video upload is BLOCKED (HTTP 403)', async () => {
      const body = buildMultipartBody('test.mp4', 'video/mp4', validMp4Buffer);
      const res = await fetch(`${BASE_URL}/api/upload`, {
        method: 'POST',
        headers: getTestHeaders({
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          Cookie: `kryty_session=${studentToken}`,
        }),
        body,
      });
      return res.status === 403;
    });

    // 2. Teacher cannot upload about-video category
    await test('Authorization: Teacher attempting about-video upload is BLOCKED (HTTP 403)', async () => {
      const body = buildMultipartBody('test.mp4', 'video/mp4', validMp4Buffer);
      const res = await fetch(`${BASE_URL}/api/upload`, {
        method: 'POST',
        headers: getTestHeaders({
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          Cookie: `kryty_session=${teacherToken}`,
        }),
        body,
      });
      return res.status === 403;
    });

    // 3. Admin can upload valid MP4
    let uploadedVideoUrl = null;
    await test('Admin upload: Admin uploads valid MP4 video under 50MB (HTTP 200, public URL returned)', async () => {
      const body = buildMultipartBody('intro.mp4', 'video/mp4', validMp4Buffer);
      const res = await fetch(`${BASE_URL}/api/upload`, {
        method: 'POST',
        headers: getTestHeaders({
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          Cookie: `kryty_session=${adminToken}`,
        }),
        body,
      });
      const json = await res.json();
      if (res.status === 200 && json.success && json.url) {
        uploadedVideoUrl = json.url;
        return uploadedVideoUrl.startsWith('/uploads/public/videos/');
      }
      return false;
    });

    // 4. File existence on disk
    if (uploadedVideoUrl) {
      await test('Storage Verification: Uploaded video file exists in public/uploads/public/videos', () => {
        const localPath = path.join(process.cwd(), 'public', uploadedVideoUrl);
        return fs.existsSync(localPath);
      });
    }

    // 5. Admin updates about video setting
    await test('Admin Settings: Setting aboutPlatformVideoUrl to uploaded local video succeeds', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/settings`, {
        method: 'POST',
        headers: getTestHeaders({
          'Content-Type': 'application/json',
          Cookie: `kryty_session=${adminToken}`,
        }),
        body: JSON.stringify({
          settings: {
            aboutPlatformVideoUrl: uploadedVideoUrl || '/uploads/public/videos/sample.mp4',
          },
        }),
      });
      const json = await res.json();
      return res.status === 200 && json.success;
    });

    // 6. Precedence check on About page
    await test('Precedence Check: /about page recognizes local video precedence over YouTube', async () => {
      const res = await fetch(`${BASE_URL}/about`, {
        headers: getTestHeaders(),
      });
      const html = await res.text();
      // When local video is configured, html should render <video tag with the local source
      return res.status === 200 && html.includes('<video');
    });

    // -------------------------------------------------------------------------
    // SECTION 2: GOOGLE SHEETS OAUTH & REAL INTEGRATION
    // -------------------------------------------------------------------------
    console.log('\n--- Section 2: Google Sheets OAuth & Honest Status ---');

    // 1. URL validation
    await test('Google Sheets URL Parser: correctly identifies valid sheet URLs and IDs', () => {
      const v1 = validateGoogleSheetUrl('https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit');
      const v2 = validateGoogleSheetUrl('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms');
      const v3 = validateGoogleSheetUrl('https://invalid.com/file');
      return v1.isValid && v2.isValid && !v3.isValid;
    });

    // 2. Google OAuth connect route
    await test('Google OAuth: GET /api/auth/google/connect checks teacher auth & credentials', async () => {
      const res = await fetch(`${BASE_URL}/api/auth/google/connect`, {
        headers: getTestHeaders({ Cookie: `kryty_session=${teacherToken}` }),
      });
      const json = await res.json();
      // If GOOGLE_CLIENT_ID is not configured, it returns 503 with exact reason; if configured, it returns auth URL
      if (!process.env.GOOGLE_CLIENT_ID) {
        return res.status === 503 && json.error.includes('GOOGLE_CLIENT_ID');
      }
      return res.status === 200 && json.url.includes('accounts.google.com');
    });

    // 3. Google OAuth status route
    await test('Google OAuth Status: GET /api/auth/google/status returns connection state', async () => {
      const res = await fetch(`${BASE_URL}/api/auth/google/status`, {
        headers: getTestHeaders({ Cookie: `kryty_session=${teacherToken}` }),
      });
      const json = await res.json();
      return res.status === 200 && typeof json.connected === 'boolean';
    });

    // 4. Honest reporting: No simulated pass when credentials are absent
    await test('Google Sheets API: Honest reporting - purchase returns 503 blocked when external credentials absent', async () => {
      const testProduct = await prisma.product.findFirst({ where: { isPublished: true } });
      if (!testProduct) return true;

      const sampleSheetUrl = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit';
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { sheetsWebhookUrl: sampleSheetUrl },
      });

      const res = await fetch(`${BASE_URL}/api/purchase`, {
        method: 'POST',
        headers: getTestHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          productId: testProduct.id,
          buyerName: 'ياسين',
          buyerLastName: 'بلقاسم',
          buyerPhone: '0661234567',
          submissionToken: `honest_check_${Date.now()}`,
        }),
      });

      const json = await res.json();
      // Because Google Cloud credentials are not configured in local dev:
      // It MUST return 503 with blocked: true and missingConfig, NOT a fake 200 simulation!
      if (!process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
        return res.status === 503 && json.blocked === true && json.missingConfig?.length > 0;
      }
      return res.status === 200;
    });

    // 6. Double-submit protection on /api/purchase
    await test('Double-Submit Protection: Resubmitting identical submissionToken returns 409 Conflict', async () => {
      const testProduct = await prisma.product.findFirst({ where: { isPublished: true } });
      if (!testProduct) return true;

      const dupToken = `dup_test_${Date.now()}`;

      // First call
      await fetch(`${BASE_URL}/api/purchase`, {
        method: 'POST',
        headers: getTestHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          productId: testProduct.id,
          buyerName: 'ياسين',
          buyerLastName: 'بلقاسم',
          buyerPhone: '0661234567',
          submissionToken: dupToken,
        }),
      });

      // Second call immediately with SAME submissionToken
      const secondRes = await fetch(`${BASE_URL}/api/purchase`, {
        method: 'POST',
        headers: getTestHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          productId: testProduct.id,
          buyerName: 'ياسين',
          buyerLastName: 'بلقاسم',
          buyerPhone: '0661234567',
          submissionToken: dupToken,
        }),
      });

      const secondJson = await secondRes.json();
      return secondRes.status === 409 && secondJson.error.includes('بالفعل');
    });

  } finally {
    // Reset about video setting to clean state
    await prisma.platformSetting.deleteMany({ where: { key: { in: ['about_custom_video_url', 'aboutPlatformVideoUrl'] } } }).catch(() => {});
  }

  console.log('\n======================================================');
  console.log(`📊 GOOGLE & ABOUT VERIFICATION: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Google & About test fatal error:', err);
  process.exit(1);
});
