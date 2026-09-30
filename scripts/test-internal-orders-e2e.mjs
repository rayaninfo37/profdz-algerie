/**
 * PROF DZ — Internal Orders E2E Test Suite
 * Tests the full purchase → SQLite → Teacher Dashboard flow.
 * Requires dev server running at http://127.0.0.1:3000
 */
import { PrismaClient } from '@prisma/client';
import * as jose from 'jose';

const prisma = new PrismaClient();

// Match the JWT_SECRET used in the app
const JWT_SECRET_RAW =
  process.env.JWT_SECRET ||
  'kryty_master_secret_key_2026_dz_algeria_education';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_RAW);
const BASE_URL = 'http://127.0.0.1:3000';
const COOKIE_NAME = 'kryty_session';

let passed = 0;
let failed = 0;
const failures = [];

// ─── helpers ────────────────────────────────────────────────────────────────

async function createToken(payload) {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ❌ [FAIL] ${name}: ${e.message}`);
    failed++;
    failures.push({ name, error: e.message });
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

// Wait ms between rapid purchase calls to avoid hitting self rate-limit (5/min)
const sleep = (ms) => new Promise(res => setTimeout(res, ms));
const PURCHASE_DELAY = 13000; // 13s — ensures we stay under 5/min across the full test

// ─── main ────────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n====================================================');
  console.log('🧪 PROF DZ — INTERNAL ORDERS E2E TEST SUITE');
  console.log('====================================================\n');

  // ── SETUP ─────────────────────────────────────────────────────────────────
  // Find two teachers for IDOR tests
  const teacherUsers = await prisma.user.findMany({
    where: { role: 'TEACHER', isFrozen: false, softDeletedAt: null },
    include: { teacherProfile: true },
    take: 2,
  });

  if (!teacherUsers[0]?.teacherProfile) {
    console.error('❌ SETUP FAILED: No teacher with profile found in DB.');
    await prisma.$disconnect();
    process.exit(1);
  }

  const teacherA     = teacherUsers[0];
  const profileA     = teacherA.teacherProfile;
  const teacherB     = teacherUsers[1] ?? null;
  const profileB     = teacherB?.teacherProfile ?? null;

  // Create a test product with a custom form schema
  const testProduct = await prisma.product.create({
    data: {
      creatorId:    profileA.id,
      creatorName:  teacherA.fullName,
      creatorType:  'TEACHER',
      title:        '[TEST] منتج اختباري للطلبات الداخلية',
      slug:         `orders-e2e-test-${Date.now()}`,
      description:  'منتج مؤقت لاختبار نظام الطلبات الداخلي',
      productType:  'BOOK',
      subject:      'رياضيات',
      educationLevel: 'SECONDARY',
      priceDZD:     1500,
      isPublished:  true,
      purchaseFormSchema: JSON.stringify([
        { id: 'wilaya',        label: 'الولاية',       type: 'text',   required: true },
        { id: 'paymentMethod', label: 'طريقة الدفع',   type: 'select', required: true,
          options: ['CCP', 'BaridiMob', 'تحويل بنكي'] },
      ]),
    },
  });

  console.log(`[SETUP] Teacher A: ${teacherA.email} / profile ${profileA.id}`);
  if (teacherB) console.log(`[SETUP] Teacher B: ${teacherB.email} / profile ${profileB?.id}`);
  console.log(`[SETUP] Test product: ${testProduct.id}\n`);

  const tokenA = await createToken({
    userId:   teacherA.id,
    email:    teacherA.email,
    role:     'TEACHER',
    fullName: teacherA.fullName,
  });

  const tokenB = teacherB ? await createToken({
    userId:   teacherB.id,
    email:    teacherB.email,
    role:     'TEACHER',
    fullName: teacherB.fullName,
  }) : null;

  const tok1 = `e2e-tok-A-${Date.now()}`;
  const tok2 = `e2e-tok-B-${Date.now() + 1}`;
  let   mainOrderId = null;

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 1 — Happy Path: Purchase creates real DB record
  // ══════════════════════════════════════════════════════════════════════════
  console.log('─── Section 1: Happy Path ───');

  await test('POST /api/purchase saves order to SQLite', async () => {
    const res = await fetch(`${BASE_URL}/api/purchase`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId:   testProduct.id,
        firstName:   'محمد',
        lastName:    'بن علي',
        phone:       '0551234567',
        customFields: { wilaya: 'الجزائر', paymentMethod: 'CCP' },
        submissionToken: tok1,
        _hp: '',
      }),
    });
    const data = await res.json();
    assert(res.status === 200, `Expected 200, got ${res.status}: ${data.error}`);
    assert(data.success === true, 'success must be true');
    assert(data.orderId, 'orderId must be returned');
    mainOrderId = data.orderId;
  });

  await test('Order exists in SQLite with all correct fields', async () => {
    assert(mainOrderId, 'No orderId from previous test');
    const order = await prisma.productOrder.findUnique({ where: { id: mainOrderId } });
    assert(order, 'Order not in DB');
    assert(order.firstName === 'محمد', `firstName: ${order.firstName}`);
    assert(order.lastName  === 'بن علي', `lastName: ${order.lastName}`);
    assert(order.phone     === '0551234567', `phone: ${order.phone}`);
    assert(order.status    === 'NEW', `status: ${order.status}`);
    assert(order.productId === testProduct.id, 'productId mismatch');
    assert(order.teacherProfileId === profileA.id, 'teacherProfileId mismatch');
    assert(order.productTitleSnapshot === testProduct.title, 'title snapshot mismatch');
    assert(order.productPriceSnapshot === testProduct.priceDZD, 'price snapshot mismatch');
    const cf = JSON.parse(order.customFields);
    assert(cf.wilaya === 'الجزائر', 'wilaya custom field');
    assert(cf.paymentMethod === 'CCP', 'paymentMethod custom field');
    const schema = JSON.parse(order.formSchemaSnapshot);
    assert(Array.isArray(schema) && schema.length === 2, `schema length: ${schema.length}`);
  });

  await test('Order persists across queries (DB persistence)', async () => {
    const order = await prisma.productOrder.findUnique({ where: { id: mainOrderId } });
    assert(order !== null, 'Order must persist in DB');
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 2 — Idempotency: duplicate token → no second order
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n─── Section 2: Idempotency ───');

  await test('Duplicate submissionToken: returns 200, no duplicate record', async () => {
    await sleep(PURCHASE_DELAY); // respect rate limit
    const res = await fetch(`${BASE_URL}/api/purchase`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: testProduct.id,
        firstName: 'محمد', lastName: 'بن علي', phone: '0551234567',
        customFields: {},
        submissionToken: tok1,  // SAME token
        _hp: '',
      }),
    });
    const data = await res.json();
    assert(res.status === 200, `Expected 200, got ${res.status}: ${JSON.stringify(data)}`);
    assert(data.success === true, 'Must return success on duplicate');
    const count = await prisma.productOrder.count({ where: { submissionToken: tok1 } });
    assert(count === 1, `Expected 1 record, found ${count}`);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 3 — Validation
  // Note: these tests each make one purchase-shaped request (though they fail early).
  // We still need to stay under the 5/min rate limit.
  // Add a sleep so the previous 2 requests' window resets fully.
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n─── Section 3: Validation (waiting for rate limit reset...) ───');
  await sleep(62000); // 62s — ensures the 1-minute window fully resets

  await test('Missing firstName → 400', async () => {
    const res = await fetch(`${BASE_URL}/api/purchase`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: testProduct.id, firstName: '', lastName: 'X',
        phone: '055', submissionToken: 'v-no-fname', _hp: '' }),
    });
    assert(res.status === 400, `Got ${res.status}`);
  });

  await test('Missing lastName → 400', async () => {
    const res = await fetch(`${BASE_URL}/api/purchase`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: testProduct.id, firstName: 'Ali', lastName: '',
        phone: '055', submissionToken: 'v-no-lname', _hp: '' }),
    });
    assert(res.status === 400, `Got ${res.status}`);
  });

  await test('Missing phone → 400', async () => {
    const res = await fetch(`${BASE_URL}/api/purchase`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: testProduct.id, firstName: 'Ali', lastName: 'X',
        phone: '', submissionToken: 'v-no-phone', _hp: '' }),
    });
    assert(res.status === 400, `Got ${res.status}`);
  });

  await test('Missing required custom field (wilaya) → 400', async () => {
    const res = await fetch(`${BASE_URL}/api/purchase`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: testProduct.id, firstName: 'Ali', lastName: 'X', phone: '055',
        customFields: { paymentMethod: 'CCP' },   // wilaya is required but missing
        submissionToken: 'v-missing-wilaya', _hp: '',
      }),
    });
    assert(res.status === 400, `Got ${res.status}`);
    const d = await res.json();
    assert(d.error?.includes('الولاية'), `Expected wilaya error, got: ${d.error}`);
  });

  await test('Invalid select option → 400', async () => {
    const res = await fetch(`${BASE_URL}/api/purchase`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: testProduct.id, firstName: 'Ali', lastName: 'X', phone: '055',
        customFields: { wilaya: 'وهران', paymentMethod: 'HACKED_VALUE' },
        submissionToken: 'v-bad-select', _hp: '',
      }),
    });
    assert(res.status === 400, `Got ${res.status}`);
  });

  await test('Invalid productId → 404', async () => {
    const res = await fetch(`${BASE_URL}/api/purchase`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: '00000000-0000-0000-0000-000000000000',
        firstName: 'Ali', lastName: 'X', phone: '055',
        submissionToken: 'v-bad-product', _hp: '',
      }),
    });
    assert(res.status === 404, `Got ${res.status}`);
  });

  await test('Unpublished product → 404', async () => {
    await prisma.product.update({ where: { id: testProduct.id }, data: { isPublished: false } });
    const res = await fetch(`${BASE_URL}/api/purchase`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: testProduct.id, firstName: 'Ali', lastName: 'X', phone: '055',
        submissionToken: 'v-unpublished', _hp: '',
      }),
    });
    assert(res.status === 404, `Got ${res.status}`);
    await prisma.product.update({ where: { id: testProduct.id }, data: { isPublished: true } });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 4 — Security / IDOR
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n─── Section 4: Security / IDOR ───');

  await test('GET /api/orders without auth → 401', async () => {
    const res = await fetch(`${BASE_URL}/api/orders`);
    assert(res.status === 401, `Got ${res.status}`);
  });

  await test('Teacher A sees their own orders', async () => {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      headers: { Cookie: `${COOKIE_NAME}=${tokenA}` },
    });
    assert(res.status === 200, `Got ${res.status}`);
    const data = await res.json();
    assert(Array.isArray(data.orders), 'orders must be array');
    const found = data.orders.find(o => o.id === mainOrderId);
    assert(found, 'Teacher A must see own order');
  });

  await test('GET /api/orders for Teacher A returns ONLY their orders (DB verified)', async () => {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      headers: { Cookie: `${COOKIE_NAME}=${tokenA}` },
    });
    const data = await res.json();
    if (data.orders.length > 0) {
      const ids = data.orders.map(o => o.id);
      const wrong = await prisma.productOrder.findMany({
        where: { id: { in: ids }, NOT: { teacherProfileId: profileA.id } },
      });
      assert(wrong.length === 0, `Teacher A received ${wrong.length} orders not belonging to them`);
    }
  });

  await test('GET /api/orders/[id] without auth → 401', async () => {
    const res = await fetch(`${BASE_URL}/api/orders/${mainOrderId}`);
    assert(res.status === 401, `Got ${res.status}`);
  });

  await test('Teacher A accesses own order detail', async () => {
    const res = await fetch(`${BASE_URL}/api/orders/${mainOrderId}`, {
      headers: { Cookie: `${COOKIE_NAME}=${tokenA}` },
    });
    assert(res.status === 200, `Got ${res.status}`);
    const data = await res.json();
    assert(data.order?.firstName === 'محمد', 'firstName mismatch');
    assert(data.order?.phone === '0551234567', 'phone mismatch');
    assert(typeof data.order?.customFields === 'object', 'customFields must be object');
    assert(data.order?.customFields?.wilaya === 'الجزائر', 'wilaya mismatch');
    assert(Array.isArray(data.order?.formSchemaSnapshot), 'formSchemaSnapshot must be array');
  });

  if (tokenB && profileB) {
    await test('Teacher B CANNOT access Teacher A order → 403', async () => {
      const res = await fetch(`${BASE_URL}/api/orders/${mainOrderId}`, {
        headers: { Cookie: `${COOKIE_NAME}=${tokenB}` },
      });
      assert(res.status === 403, `Expected 403, got ${res.status}`);
    });

    await test('Teacher B orders list does NOT contain Teacher A orders', async () => {
      const res = await fetch(`${BASE_URL}/api/orders`, {
        headers: { Cookie: `${COOKIE_NAME}=${tokenB}` },
      });
      const data = await res.json();
      const found = (data.orders || []).find(o => o.id === mainOrderId);
      assert(!found, 'Teacher B must NOT see Teacher A orders');
    });
  } else {
    console.log('  ⏭  [SKIP] Teacher B IDOR tests — only one teacher in DB');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 5 — Read / Unread lifecycle
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n─── Section 5: Read / Unread ───');

  let unreadOrderId = null;

  await test('New order starts with status NEW', async () => {
    await sleep(PURCHASE_DELAY); // respect rate limit
    const res = await fetch(`${BASE_URL}/api/purchase`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: testProduct.id,
        firstName: 'فاطمة', lastName: 'كريم', phone: '0559876543',
        customFields: { wilaya: 'وهران', paymentMethod: 'BaridiMob' },
        submissionToken: tok2, _hp: '',
      }),
    });
    const data = await res.json();
    assert(res.status === 200, `purchase failed: ${data.error}`);
    unreadOrderId = data.orderId;
    const order = await prisma.productOrder.findUnique({ where: { id: unreadOrderId } });
    assert(order.status === 'NEW', `Status should be NEW, got ${order.status}`);
  });

  await test('Opening order detail marks it READ and sets readAt', async () => {
    assert(unreadOrderId, 'No unreadOrderId');
    await fetch(`${BASE_URL}/api/orders/${unreadOrderId}`, {
      headers: { Cookie: `${COOKIE_NAME}=${tokenA}` },
    });
    const order = await prisma.productOrder.findUnique({ where: { id: unreadOrderId } });
    assert(order.status === 'READ', `Expected READ, got ${order.status}`);
    assert(order.readAt !== null, 'readAt must be set');
  });

  await test('newCount from /api/orders matches actual DB count', async () => {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      headers: { Cookie: `${COOKIE_NAME}=${tokenA}` },
    });
    const data = await res.json();
    const dbCount = await prisma.productOrder.count({
      where: { teacherProfileId: profileA.id, status: 'NEW' },
    });
    assert(data.newCount === dbCount, `API newCount ${data.newCount} ≠ DB ${dbCount}`);
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 6 — Product deletion: historical orders survive
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n─── Section 6: Historical Order Survival ───');

  await test('Deleting product does NOT destroy historical orders (SET NULL)', async () => {
    const tempProduct = await prisma.product.create({
      data: {
        creatorId: profileA.id, creatorName: teacherA.fullName, creatorType: 'TEACHER',
        title: '[TEMP] للحذف',
        slug: `del-test-${Date.now()}`,
        description: 'مؤقت',
        productType: 'BOOK', subject: 'رياضيات', educationLevel: 'SECONDARY',
        priceDZD: 100, isPublished: true,
      },
    });

    const tempOrder = await prisma.productOrder.create({
      data: {
        productId: tempProduct.id, teacherProfileId: profileA.id,
        productTitleSnapshot: tempProduct.title, productPriceSnapshot: tempProduct.priceDZD,
        teacherNameSnapshot: teacherA.fullName, formSchemaSnapshot: '[]',
        firstName: 'اختبار', lastName: 'الحذف', phone: '0550000001',
        customFields: '{}', submissionToken: `del-test-${Date.now()}`, status: 'NEW',
      },
    });

    await prisma.product.delete({ where: { id: tempProduct.id } });

    const surviving = await prisma.productOrder.findUnique({ where: { id: tempOrder.id } });
    assert(surviving !== null, 'Order must survive product deletion');
    assert(surviving.productId === null, 'productId must be NULL after deletion');
    assert(surviving.productTitleSnapshot === '[TEMP] للحذف', 'snapshot must survive');

    await prisma.productOrder.delete({ where: { id: tempOrder.id } });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION 7 — No Google Sheets dependency
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n─── Section 7: No Google Sheets Dependency ───');

  await test('Purchase succeeds without any Google/sheets config', async () => {
    await sleep(PURCHASE_DELAY); // respect rate limit
    // Ensure teacher has no sheetsDestination
    await prisma.teacherProfile.update({
      where: { id: profileA.id },
      data: { sheetsDestination: null },
    });
    const res = await fetch(`${BASE_URL}/api/purchase`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: testProduct.id,
        firstName: 'نادية', lastName: 'حمدي', phone: '0555000111',
        customFields: { wilaya: 'قسنطينة', paymentMethod: 'BaridiMob' },
        submissionToken: `no-sheets-${Date.now()}`, _hp: '',
      }),
    });
    const data = await res.json();
    assert(res.status === 200, `Expected 200, got ${res.status}: ${data.error}`);
    assert(data.orderId, 'orderId must be returned');
    const order = await prisma.productOrder.findUnique({ where: { id: data.orderId } });
    assert(order !== null, 'Order must exist in DB without Google Sheets');
    await prisma.productOrder.delete({ where: { id: data.orderId } });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // CLEANUP
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n─── Cleanup ───');
  try {
    await prisma.productOrder.deleteMany({
      where: { submissionToken: { startsWith: 'e2e-tok-' } },
    });
    if (unreadOrderId) {
      await prisma.productOrder.deleteMany({ where: { submissionToken: tok2 } });
    }
    await prisma.product.deleteMany({
      where: { slug: { startsWith: 'orders-e2e-test-' } },
    });
    console.log('  Cleanup done.');
  } catch (e) {
    console.error('  Cleanup error (non-fatal):', e.message);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RESULTS
  // ══════════════════════════════════════════════════════════════════════════
  console.log(`\n${'='.repeat(52)}`);
  console.log(`📊 INTERNAL ORDERS E2E: ${passed} PASSED, ${failed} FAILED`);
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(f => console.log(`  ❌ ${f.name}: ${f.error}`));
  }
  console.log('='.repeat(52) + '\n');

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(async (e) => {
  console.error('FATAL:', e);
  await prisma.$disconnect();
  process.exit(1);
});
