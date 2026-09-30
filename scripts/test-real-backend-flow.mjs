import http from 'http';
import { PrismaClient } from '@prisma/client';
import * as jose from 'jose';

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'kryty_super_secret_jwt_key_algeria_education_2026_dev_mode_only');
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
  console.log('🚀 EXECUTING REAL HTTP END-TO-END BACKEND HARDENING TEST');
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
        console.error(`  ❌ [FAIL] ${name} (assertion failed)`);
        failed++;
      }
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  // Find Admin and Teacher
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  const teacherProfile = await prisma.teacherProfile.findFirst({
    where: { id: 'dbd1dc87-3420-43b8-ad47-ea6a9da8e951' },
    include: { user: true, subscriptions: true }
  });

  if (!adminUser || !teacherProfile) {
    throw new Error('Admin or Teacher not found in DB');
  }

  const adminToken = await createToken({
    userId: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
    fullName: adminUser.fullName,
  });

  const teacherToken = await createToken({
    userId: teacherProfile.userId,
    email: teacherProfile.user.email,
    role: teacherProfile.user.role,
    fullName: teacherProfile.user.fullName,
  });

  const teacherProduct = await prisma.product.findFirst({
    where: { creatorId: teacherProfile.id, isPublished: true }
  });

  console.log(`[SETUP] Admin: ${adminUser.email}, Teacher: ${teacherProfile.user.email}, Product: ${teacherProduct?.id}`);

  // Record exact literal initial DB state to guarantee literal restoration
  const initialUser = await prisma.user.findUnique({ where: { id: teacherProfile.userId } });
  const initialTeacher = await prisma.teacherProfile.findUnique({ where: { id: teacherProfile.id } });
  const initialProduct = teacherProduct ? await prisma.product.findUnique({ where: { id: teacherProduct.id } }) : null;
  const initialSubs = await prisma.subscription.findMany({ where: { teacherId: teacherProfile.id } });

  try {
    // -------------------------------------------------------------
    // PART 1: REAL HTTP FREEZE / UNFREEZE LIFECYCLE
    // -------------------------------------------------------------
    console.log('\n--- 1. REAL HTTP FREEZE / UNFREEZE LIFECYCLE ---');

    // 1.1 Freeze via Admin API
    await test('Admin API: PATCH /api/admin/users FREEZE succeeds with HTTP 200', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/users`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `kryty_session=${adminToken}`,
        },
        body: JSON.stringify({
          targetUserId: teacherProfile.userId,
          action: 'FREEZE',
          adminNote: 'Automated Real E2E Test Freeze',
        }),
      });
      const data = await res.json();
      return res.status === 200 && data.success === true;
    });

    // 1.2 Verify DB state after freeze
    await test('DB State: Teacher isFrozen === true and subscriptionState === FROZEN', async () => {
      const freshUser = await prisma.user.findUnique({ where: { id: teacherProfile.userId } });
      const freshTeacher = await prisma.teacherProfile.findUnique({ where: { id: teacherProfile.id } });
      return freshUser.isFrozen === true && freshTeacher.subscriptionState === 'FROZEN';
    });

    // 1.3 Existing Teacher Session is blocked
    await test('Existing Session: GET /api/auth/me returns blocked: true for frozen user', async () => {
      const res = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: { 'Cookie': `kryty_session=${teacherToken}` },
      });
      const data = await res.json();
      return res.status === 200 && data.authenticated === true && data.blocked === true;
    });

    // 1.4 Login is rejected for frozen teacher
    await test('Login Guard: POST /api/auth/login returns 403 Forbidden for frozen user', async () => {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: teacherProfile.user.email,
          password: 'any_password',
        }),
      });
      const data = await res.json();
      return res.status === 403 && data.error && data.error.includes('تجميد');
    });

    // 1.5 Mutation is rejected for frozen teacher
    await test('Mutation Guard: POST /api/products returns 403 for frozen teacher session', async () => {
      const res = await fetch(`${BASE_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `kryty_session=${teacherToken}`,
        },
        body: JSON.stringify({
          title: 'Unauthorized Frozen Product Test',
          description: 'This must be blocked',
          subject: 'MATH',
          educationLevel: 'SECONDARY',
          priceDZD: 1000,
        }),
      });
      const data = await res.json();
      return res.status === 403;
    });

    // 1.6 Discovery: Frozen teacher is hidden from public API
    await test('Discovery Guard: GET /api/products hides products of frozen teacher', async () => {
      const res = await fetch(`${BASE_URL}/api/products`);
      const data = await res.json();
      if (!res.ok) return false;
      const found = data.products?.some(p => p.creatorId === teacherProfile.id || p.id === teacherProduct?.id);
      return found === false;
    });

    // 1.7 Admin can still access and manage the user
    await test('Admin Access: GET /api/admin/users still returns the frozen teacher for admin', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/users?q=${encodeURIComponent(teacherProfile.user.email)}`, {
        headers: { 'Cookie': `kryty_session=${adminToken}` },
      });
      const data = await res.json();
      return res.status === 200 && data.users?.some(u => u.id === teacherProfile.userId && u.isFrozen === true);
    });

    // 1.8 Unfreeze via Admin API
    await test('Admin API: PATCH /api/admin/users UNFREEZE restores user with HTTP 200', async () => {
      const res = await fetch(`${BASE_URL}/api/admin/users`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `kryty_session=${adminToken}`,
        },
        body: JSON.stringify({
          targetUserId: teacherProfile.userId,
          action: 'UNFREEZE',
          adminNote: 'Automated Real E2E Test Unfreeze',
        }),
      });
      const data = await res.json();
      return res.status === 200 && data.success === true;
    });

    // 1.9 Verify restored state in DB: unexpired PRO subscription is preserved (NOT downgraded to FREE)
    await test('DB State: Unfreeze accurately restored PRO_ACTIVE (not downgraded to FREE)', async () => {
      const freshUser = await prisma.user.findUnique({ where: { id: teacherProfile.userId } });
      const freshTeacher = await prisma.teacherProfile.findUnique({ where: { id: teacherProfile.id } });
      return freshUser.isFrozen === false && freshTeacher.subscriptionState === 'PRO_ACTIVE';
    });

    // 1.10 Existing session unblocked
    await test('Existing Session: GET /api/auth/me returns blocked: false after unfreeze', async () => {
      const res = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: { 'Cookie': `kryty_session=${teacherToken}` },
      });
      const data = await res.json();
      return res.status === 200 && data.authenticated === true && data.blocked === false;
    });

    // -------------------------------------------------------------
    // PART 2: REAL SUBSCRIPTION EXPIRATION & CLEANUP RECONCILIATION
    // -------------------------------------------------------------
    console.log('\n--- 2. REAL SUBSCRIPTION EXPIRATION & CLEANUP RECONCILIATION ---');

    // Create a temporary test user and teacher with expired subscription
    const testUser = await prisma.user.create({
      data: {
        email: `test_exp_${Date.now()}@example.com`,
        passwordHash: 'dummyhash123',
        fullName: 'Test Expired Teacher',
        role: 'TEACHER',
        wilaya: 'Algiers (الجزائر)',
      }
    });

    const testExpiredTeacher = await prisma.teacherProfile.create({
      data: {
        userId: testUser.id,
        headline: 'Test Expired Teacher',
        bio: 'For testing expiration',
        subjects: '["MATH"]',
        educationLevels: '["SECONDARY"]',
        subscriptionState: 'PRO_ACTIVE',
        createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 days old (trial expired)
      }
    });

    const testExpiredSub = await prisma.subscription.create({
      data: {
        teacherId: testExpiredTeacher.id,
        plan: 'PRO_2800_30DAYS',
        amount: 2800,
        status: 'ACTIVE',
        startedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // expired 5 days ago!
        paymentRef: 'TEST_EXPIRED_SUB_REF'
      }
    });

    await test('Actual Cleanup Route: GET /api/internal/cleanup reconciles expired subscription in DB', async () => {
      const res = await fetch(`${BASE_URL}/api/internal/cleanup`, {
        headers: { 'x-cron-secret': 'internal-cleanup-dev' }
      });
      const data = await res.json();
      
      const updatedSub = await prisma.subscription.findUnique({ where: { id: testExpiredSub.id } });
      const updatedTeacher = await prisma.teacherProfile.findUnique({ where: { id: testExpiredTeacher.id } });

      return res.status === 200 &&
             data.success === true &&
             updatedSub.status === 'EXPIRED' &&
             updatedTeacher.subscriptionState === 'PRO_EXPIRED';
    });

    // Clean up temporary test teacher and subscription
    await prisma.subscription.delete({ where: { id: testExpiredSub.id } });
    await prisma.teacherProfile.delete({ where: { id: testExpiredTeacher.id } });
    await prisma.user.delete({ where: { id: testUser.id } });

    // -------------------------------------------------------------
    // PART 3: REAL HTTP GOOGLE SHEETS PURCHASE FLOW
    // -------------------------------------------------------------
    console.log('\n--- 3. REAL HTTP GOOGLE SHEETS PURCHASE FLOW ---');

    // Start a mock Google Apps Script Webhook server on port 3999
    let lastReceivedPayload = null;
    let mockMode = 'SUCCESS'; // 'SUCCESS' | 'LOGIN_REDIRECT' | 'ERROR_403'

    const mockServer = http.createServer((req, res) => {
      if (req.method === 'POST' && req.url === '/macros/s/AKfycb_test_webhook/exec') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try { lastReceivedPayload = JSON.parse(body); } catch { lastReceivedPayload = body; }

          if (mockMode === 'SUCCESS') {
            // Apps Script sends 302 redirect
            res.writeHead(302, { 'Location': 'http://127.0.0.1:3999/redirected-success' });
            res.end();
          } else if (mockMode === 'LOGIN_REDIRECT') {
            // Apps script redirected to Google Login (script permission private)
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('<html><head><title>Google Accounts</title></head><body><a href="https://accounts.google.com/ServiceLogin">Sign in</a></body></html>');
          } else if (mockMode === 'ERROR_403') {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('Forbidden');
          }
        });
      } else if (req.url === '/redirected-success') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ result: 'success', row: 42 }));
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    await new Promise(resolve => mockServer.listen(3999, resolve));

    // Test 3.1: Product without any webhook or destination configured returns 503
    await prisma.product.update({
      where: { id: teacherProduct.id },
      data: { sheetsWebhookUrl: null }
    });
    await prisma.teacherProfile.update({
      where: { id: teacherProfile.id },
      data: { sheetsDestination: null }
    });

    await test('Purchase API: Returns 503 when neither product nor teacher has sheets configured', async () => {
      const res = await fetch(`${BASE_URL}/api/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: teacherProduct.id,
          buyerName: 'أحمد',
          buyerLastName: 'بلقاسم',
          buyerPhone: '0555123456',
        }),
      });
      const data = await res.json();
      return res.status === 503 && data.error && data.error.includes('خدمة الطلبات غير مفعّلة');
    });

    // Test 3.2: Configure Teacher's sheetsDestination -> fallback is used
    await prisma.teacherProfile.update({
      where: { id: teacherProfile.id },
      data: { sheetsDestination: 'http://127.0.0.1:3999/macros/s/AKfycb_test_webhook/exec' }
    });

    await test('Purchase API: Falls back to Teacher sheetsDestination and successfully delivers HTTP POST', async () => {
      mockMode = 'SUCCESS';
      lastReceivedPayload = null;
      const res = await fetch(`${BASE_URL}/api/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: teacherProduct.id,
          buyerName: 'ياسين',
          buyerLastName: 'بن عمار',
          buyerPhone: '0666789012',
          submissionToken: 'test_token_123',
          formData: { wilaya: 'الجزائر', notes: 'يرجى الاتصال مساء' }
        }),
      });
      const data = await res.json();
      return res.status === 200 &&
             data.success === true &&
             lastReceivedPayload &&
             lastReceivedPayload.buyerName === 'ياسين' &&
             lastReceivedPayload.buyerPhone === '0666789012' &&
             lastReceivedPayload.productId === teacherProduct.id;
    });

    // Test 3.3: Product-level sheetsWebhookUrl overrides teacher destination
    await prisma.product.update({
      where: { id: teacherProduct.id },
      data: { sheetsWebhookUrl: 'http://127.0.0.1:3999/macros/s/AKfycb_test_webhook/exec' }
    });

    await test('Purchase API: Product sheetsWebhookUrl takes priority and delivers correctly', async () => {
      mockMode = 'SUCCESS';
      lastReceivedPayload = null;
      const res = await fetch(`${BASE_URL}/api/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: teacherProduct.id,
          buyerName: 'فاطمة',
          buyerPhone: '0777123456',
        }),
      });
      const data = await res.json();
      return res.status === 200 &&
             data.success === true &&
             lastReceivedPayload &&
             lastReceivedPayload.buyerName === 'فاطمة';
    });

    // Test 3.4: Google Apps Script returning login redirect triggers clear error
    await test('Purchase API: Detects Google Accounts login redirect and returns informative error', async () => {
      mockMode = 'LOGIN_REDIRECT';
      const res = await fetch(`${BASE_URL}/api/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: teacherProduct.id,
          buyerName: 'كريم',
          buyerPhone: '0544112233',
        }),
      });
      const data = await res.json();
      return res.status === 502 && data.error && data.error.includes('تسجيل الدخول');
    });

    // Close mock server
    mockServer.close();

  } finally {
    // -------------------------------------------------------------
    // RESTORATION: ALWAYS RESTORE EXACT INITIAL DB STATE LITERALLY
    // -------------------------------------------------------------
    console.log('\n[CLEANUP] Restoring exact original state in DB...');
    if (initialUser) {
      await prisma.user.update({
        where: { id: initialUser.id },
        data: {
          isFrozen: initialUser.isFrozen,
          frozenAt: initialUser.frozenAt,
          softDeletedAt: initialUser.softDeletedAt,
          restorableUntil: initialUser.restorableUntil,
        },
      });
    }

    if (initialTeacher) {
      await prisma.teacherProfile.update({
        where: { id: initialTeacher.id },
        data: {
          subscriptionState: initialTeacher.subscriptionState,
          sheetsDestination: initialTeacher.sheetsDestination,
        },
      });
    }

    if (initialProduct) {
      await prisma.product.update({
        where: { id: initialProduct.id },
        data: {
          sheetsWebhookUrl: initialProduct.sheetsWebhookUrl,
        },
      });
    }

    for (const sub of initialSubs) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: sub.status,
          expiresAt: sub.expiresAt,
          startedAt: sub.startedAt,
        },
      });
    }

    console.log('[CLEANUP] Original state restored literally and completely.');
  }

  console.log('\n======================================================');
  console.log(`🏁 REAL HTTP INTEGRATION SUITE FINISHED: ${passed}/${passed + failed} PASSED`);
  console.log('======================================================\n');

  await prisma.$disconnect();
  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error('Fatal error in integration suite:', err);
  process.exit(1);
});
