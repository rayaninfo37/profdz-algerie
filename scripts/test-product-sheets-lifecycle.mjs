import { PrismaClient } from '@prisma/client';
import * as jose from 'jose';
function validateGoogleSheetUrl(input) {
  if (!input || typeof input !== 'string') return { isValid: false, spreadsheetId: null, isLegacyScript: false, error: 'رابط غير صالح' };
  const trimmed = input.trim();
  if (!trimmed) return { isValid: false, spreadsheetId: null, isLegacyScript: false, error: 'رابط فارغ' };
  const match = trimmed.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]{20,60})/);
  if (match && match[1]) return { isValid: true, spreadsheetId: match[1], isLegacyScript: false };
  if (/^[a-zA-Z0-9_-]{20,60}$/.test(trimmed)) return { isValid: true, spreadsheetId: trimmed, isLegacyScript: false };
  if (/^https?:\/\/(script\.google\.com|127\.0\.0\.1|localhost)(:\d+)?\//.test(trimmed)) return { isValid: true, spreadsheetId: null, isLegacyScript: true };
  return { isValid: false, spreadsheetId: null, isLegacyScript: false, error: 'رابط غير صالح' };
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

async function run() {
  console.log('\n======================================================');
  console.log('🚀 TESTING GOOGLE SHEETS & PRODUCT MUTATION LIFECYCLE');
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

  // 1. Google Sheets URL Validation Tests
  console.log('\n--- Section 1: Google Sheet URL Parser & Validator ---');
  await test('Accepts standard Google Sheet URL with edit and gid', () => {
    const res = validateGoogleSheetUrl('https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0');
    return res.isValid && res.spreadsheetId === '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms' && !res.isLegacyScript;
  });

  await test('Accepts standard Google Sheet URL without edit', () => {
    const res = validateGoogleSheetUrl('https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms');
    return res.isValid && res.spreadsheetId === '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
  });

  await test('Accepts raw spreadsheet ID', () => {
    const res = validateGoogleSheetUrl('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms');
    return res.isValid && res.spreadsheetId === '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
  });

  await test('Accepts legacy Google Apps Script Webhook URL for backward compatibility', () => {
    const res = validateGoogleSheetUrl('https://script.google.com/macros/s/AKfycbz_TEST/exec');
    return res.isValid && res.isLegacyScript;
  });

  await test('Rejects invalid non-sheet URL with Arabic error message', () => {
    const res = validateGoogleSheetUrl('https://example.com/not-a-google-sheet');
    return !res.isValid && res.error.includes('رابط');
  });

  await test('Rejects empty or whitespace-only URL', () => {
    const res = validateGoogleSheetUrl('   ');
    return !res.isValid;
  });

  // 2. Fetch test entities
  const teacher = await prisma.user.findFirst({
    where: { email: 'rayaninfo37@gmail.com' },
    include: { teacherProfile: true },
  });
  if (!teacher || !teacher.teacherProfile) {
    throw new Error('Test teacher not found in DB!');
  }

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    throw new Error('Test admin not found in DB!');
  }

  // Create an attacker / another student user for IDOR testing
  let student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
  if (!student) {
    student = await prisma.user.create({
      data: {
        email: 'attacker_student@test.dz',
        passwordHash: 'dummy',
        fullName: 'Attacker Student',
        role: 'STUDENT',
        isEmailVerified: true,
      },
    });
  }

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

  const adminToken = await createToken({
    userId: admin.id,
    email: admin.email,
    role: admin.role,
    fullName: admin.fullName,
  });

  // 3. Live HTTP Tests: Teacher Profile & Google Sheet Saving
  console.log('\n--- Section 2: Live HTTP - Teacher Profile & Google Sheet URL ---');
  const sampleSheetUrl = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit';

  await test('Teacher can save standard Google Sheet URL in profile via PATCH /api/profile', async () => {
    const res = await fetch(`${BASE_URL}/api/profile`, {
      method: 'PATCH',
      headers: {
        Cookie: `kryty_session=${teacherToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        teacherProfile: {
          sheetsDestination: sampleSheetUrl,
        },
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) return false;

    // Verify DB
    const updated = await prisma.teacherProfile.findUnique({ where: { id: teacher.teacherProfile.id } });
    return updated.sheetsDestination === sampleSheetUrl;
  });

  // 4. Live HTTP Tests: Product Edit (PATCH & PUT)
  console.log('\n--- Section 3: Live HTTP - Product Mutation (PATCH, PUT, IDOR, Frozen) ---');
  const existingProduct = await prisma.product.findFirst({
    where: { creatorId: teacher.teacherProfile.id },
  });
  if (!existingProduct) {
    throw new Error('No product found for teacher');
  }

  await test('Teacher can edit their own product via PATCH /api/products/[id]', async () => {
    const res = await fetch(`${BASE_URL}/api/products/${existingProduct.id}`, {
      method: 'PATCH',
      headers: {
        Cookie: `kryty_session=${teacherToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'كتاب نصائح بكالوريا (محدث)',
        sheetsWebhookUrl: sampleSheetUrl,
      }),
    });
    const json = await res.json();
    return res.status === 200 && json.success === true && json.product?.title === 'كتاب نصائح بكالوريا (محدث)';
  });

  await test('Teacher can edit their own product via PUT /api/products/[id]', async () => {
    const res = await fetch(`${BASE_URL}/api/products/${existingProduct.id}`, {
      method: 'PUT',
      headers: {
        Cookie: `kryty_session=${teacherToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: existingProduct.title,
        priceDZD: 1900,
      }),
    });
    const json = await res.json();
    return res.status === 200 && json.success === true;
  });

  await test('IDOR Prevention: Non-owner cannot edit product (returns 403)', async () => {
    const res = await fetch(`${BASE_URL}/api/products/${existingProduct.id}`, {
      method: 'PATCH',
      headers: {
        Cookie: `kryty_session=${studentToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: 'Hacked Title' }),
    });
    return res.status === 403;
  });

  await test('IDOR Prevention: Non-owner cannot delete product (returns 403)', async () => {
    const res = await fetch(`${BASE_URL}/api/products/${existingProduct.id}`, {
      method: 'DELETE',
      headers: {
        Cookie: `kryty_session=${studentToken}`,
      },
    });
    return res.status === 403;
  });

  await test('Freeze Guard: Frozen teacher cannot edit product (returns 403)', async () => {
    // Temporarily freeze user in DB
    await prisma.user.update({ where: { id: teacher.id }, data: { isFrozen: true } });
    const res = await fetch(`${BASE_URL}/api/products/${existingProduct.id}`, {
      method: 'PATCH',
      headers: {
        Cookie: `kryty_session=${teacherToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: 'Frozen Update' }),
    });
    // Unfreeze immediately
    await prisma.user.update({ where: { id: teacher.id }, data: { isFrozen: false } });
    return res.status === 403;
  });

  // 5. Product Creation, Edit, and Deletion Lifecycle
  console.log('\n--- Section 4: Live HTTP - Complete Product Create -> Edit -> Delete Lifecycle ---');
  let createdProductId = null;

  const lifecycleTeacher = await prisma.user.create({
    data: {
      email: `lifecycle_${Date.now()}@profdz.dz`,
      fullName: 'Lifecycle Test Teacher',
      passwordHash: 'dummy',
      role: 'TEACHER',
      isEmailVerified: true,
      teacherProfile: {
        create: {
          headline: 'Lifecycle Teacher',
          subjects: '[]',
          educationLevels: '[]',
          whatsapp: '0555123456',
          subscriptionState: 'PRO_ACTIVE',
          sheetsDestination: sampleSheetUrl,
        },
      },
    },
    include: { teacherProfile: true },
  });

  const lifecycleToken = await createToken({
    userId: lifecycleTeacher.id,
    email: lifecycleTeacher.email,
    role: lifecycleTeacher.role,
    fullName: lifecycleTeacher.fullName,
  });

  await test('Teacher can create a new product with Google Sheet URL via POST /api/products', async () => {
    const res = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: {
        Cookie: `kryty_session=${lifecycleToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'منتج تجريبي للاختبار',
        description: 'وصف المنتج التجريبي للاختبار الشامل لنظام المنتجات',
        subject: 'الرياضيات (Mathematics)',
        educationLevel: 'SECONDARY',
        educationTargets: ['SECONDARY', '3AS'],
        productType: 'BOOK',
        priceDZD: 1500,
        isFree: false,
        sheetsWebhookUrl: sampleSheetUrl,
      }),
    });
    const json = await res.json();
    if (res.status === 200 || res.status === 201) {
      createdProductId = json.product?.id;
      return true;
    }
    console.error('Create error:', json);
    return false;
  });

  if (createdProductId) {
    await test('Teacher can edit newly created product via PATCH /api/products/[id]', async () => {
      const res = await fetch(`${BASE_URL}/api/products/${createdProductId}`, {
        method: 'PATCH',
        headers: {
          Cookie: `kryty_session=${lifecycleToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'منتج تجريبي للاختبار (معدل)',
          priceDZD: 1200,
        }),
      });
      const json = await res.json();
      return res.status === 200 && json.product?.priceDZD === 1200;
    });

    await test('Teacher can delete their own product via DELETE /api/products/[id]', async () => {
      const res = await fetch(`${BASE_URL}/api/products/${createdProductId}`, {
        method: 'DELETE',
        headers: {
          Cookie: `kryty_session=${lifecycleToken}`,
        },
      });
      const json = await res.json();
      if (res.status !== 200 || !json.success) return false;

      // Verify product is gone from DB
      const check = await prisma.product.findUnique({ where: { id: createdProductId } });
      return check === null;
    });
  }

  // Cleanup test user
  await prisma.teacherProfile.delete({ where: { id: lifecycleTeacher.teacherProfile.id } }).catch(() => {});
  await prisma.user.delete({ where: { id: lifecycleTeacher.id } }).catch(() => {});

  // 6. Public Purchase Submission to Google Sheet
  console.log('\n--- Section 5: Live HTTP - Purchase Form Submission ---');
  await test('Public purchase submission returns honest status (503 blocked without external credentials, or 200 with credentials)', async () => {
    // Ensure product has sheetsWebhookUrl set
    await prisma.product.update({
      where: { id: existingProduct.id },
      data: { sheetsWebhookUrl: sampleSheetUrl },
    });

    const res = await fetch(`${BASE_URL}/api/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId: existingProduct.id,
        buyerName: 'ياسين',
        buyerLastName: 'بلقاسم',
        buyerPhone: '0661234567',
        formData: { wilaya: 'الجزائر العاصمة', deliveryNotes: 'يرجى الاتصال مساء' },
        submissionToken: 'test_token_' + Date.now(),
      }),
    });
    const json = await res.json();
    if (!process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      return res.status === 503 && json.blocked === true && json.missingConfig?.length > 0;
    }
    return res.status === 200 && json.success === true;
  });

  // Summary
  console.log('\n======================================================');
  console.log(`📊 FINAL RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Test execution fatal error:', err);
  process.exit(1);
});
