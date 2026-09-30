import { PrismaClient } from '@prisma/client';
import * as jose from 'jose';

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

let ipCounter = 100;
function getTestHeaders(extra = {}) {
  ipCounter++;
  return {
    'X-Forwarded-For': `10.30.${Math.floor(ipCounter / 250)}.${ipCounter % 250 + 1}`,
    ...extra,
  };
}

async function run() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING DEEP PRODUCT LIFECYCLE & RELATIONS TEST');
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

  // 1. Create Teacher A, Teacher B, and Student
  const teacherA = await prisma.user.create({
    data: {
      email: `teacher_a_${Date.now()}@profdz.test`,
      fullName: 'Teacher A',
      role: 'TEACHER',
      passwordHash: 'dummy',
      isEmailVerified: true,
      teacherProfile: {
        create: {
          headline: 'Teacher A Headline',
          subjects: '[]',
          educationLevels: '[]',
          whatsapp: '0555123456',
          subscriptionState: 'PRO_ACTIVE',
        },
      },
    },
    include: { teacherProfile: true },
  });

  const teacherB = await prisma.user.create({
    data: {
      email: `teacher_b_${Date.now()}@profdz.test`,
      fullName: 'Teacher B',
      role: 'TEACHER',
      passwordHash: 'dummy',
      isEmailVerified: true,
      teacherProfile: {
        create: {
          headline: 'Teacher B Headline',
          subjects: '[]',
          educationLevels: '[]',
          whatsapp: '0555654321',
          subscriptionState: 'PRO_ACTIVE',
        },
      },
    },
    include: { teacherProfile: true },
  });

  const student = await prisma.user.create({
    data: {
      email: `student_${Date.now()}@profdz.test`,
      fullName: 'Student Reviewer',
      role: 'STUDENT',
      passwordHash: 'dummy',
      isEmailVerified: true,
    },
  });

  const tokenA = await createToken({
    userId: teacherA.id,
    email: teacherA.email,
    role: teacherA.role,
    fullName: teacherA.fullName,
  });

  const tokenB = await createToken({
    userId: teacherB.id,
    email: teacherB.email,
    role: teacherB.role,
    fullName: teacherB.fullName,
  });

  let createdProduct = null;

  try {
    // -------------------------------------------------------------------------
    // SECTION 1: PRODUCT CREATION & INDEPENDENT PUBLISH / UNPUBLISH
    // -------------------------------------------------------------------------
    console.log('\n--- Section 1: Product Creation, Publish & Unpublish ---');

    await test('Teacher A creates a product (isPublished: true)', async () => {
      const res = await fetch(`${BASE_URL}/api/products`, {
        method: 'POST',
        headers: getTestHeaders({
          'Content-Type': 'application/json',
          Cookie: `kryty_session=${tokenA}`,
        }),
        body: JSON.stringify({
          title: 'ملخص مادة الرياضيات الشامل',
          description: 'ملخص رائع لجميع دروس الرياضيات للطور الثانوي مع تمارين محلولة',
          subject: 'الرياضيات (Mathematics)',
          educationLevel: 'SECONDARY',
          educationTargets: ['SECONDARY', '3AS'],
          productType: 'BOOK',
          priceDZD: 1200,
          isFree: false,
          isPublished: true,
        }),
      });
      const json = await res.json();
      if (res.status === 200 || res.status === 201) {
        createdProduct = json.product;
        return createdProduct.isPublished === true;
      }
      console.error('CREATE ERROR:', res.status, json);
      return false;
    });

    if (!createdProduct) {
      throw new Error('Product creation failed, cannot continue');
    }

    await test('Verify product is returned in public GET /api/products when published', async () => {
      const res = await fetch(`${BASE_URL}/api/products?creatorId=${teacherA.teacherProfile.id}`, {
        headers: getTestHeaders(),
      });
      const json = await res.json();
      const list = json.products || json.data || [];
      return list.some((p) => p.id === createdProduct.id);
    });

    await test('Teacher A unpublishes product via PATCH (isPublished: false)', async () => {
      const res = await fetch(`${BASE_URL}/api/products/${createdProduct.id}`, {
        method: 'PATCH',
        headers: getTestHeaders({
          'Content-Type': 'application/json',
          Cookie: `kryty_session=${tokenA}`,
        }),
        body: JSON.stringify({ isPublished: false }),
      });
      const json = await res.json();
      if (res.status === 200 && json.success) {
        const check = await prisma.product.findUnique({ where: { id: createdProduct.id } });
        return check.isPublished === false;
      }
      return false;
    });

    await test('Verify unpublished product is NOT in public search listing', async () => {
      const res = await fetch(`${BASE_URL}/api/products?creatorId=${teacherA.teacherProfile.id}`, {
        headers: getTestHeaders(),
      });
      const json = await res.json();
      const list = json.products || json.data || [];
      return !list.some((p) => p.id === createdProduct.id);
    });

    await test('Teacher A republishes product via PATCH (isPublished: true)', async () => {
      const res = await fetch(`${BASE_URL}/api/products/${createdProduct.id}`, {
        method: 'PATCH',
        headers: getTestHeaders({
          'Content-Type': 'application/json',
          Cookie: `kryty_session=${tokenA}`,
        }),
        body: JSON.stringify({ isPublished: true }),
      });
      const json = await res.json();
      return res.status === 200 && json.product?.isPublished === true;
    });

    // -------------------------------------------------------------------------
    // SECTION 2: IDOR & FROZEN TEACHER ENFORCEMENT
    // -------------------------------------------------------------------------
    console.log('\n--- Section 2: IDOR & Frozen Account Enforcement ---');

    await test('IDOR Protection: Teacher B CANNOT publish/unpublish/edit Teacher A product (returns 403)', async () => {
      const res = await fetch(`${BASE_URL}/api/products/${createdProduct.id}`, {
        method: 'PATCH',
        headers: getTestHeaders({
          'Content-Type': 'application/json',
          Cookie: `kryty_session=${tokenB}`,
        }),
        body: JSON.stringify({ title: 'Hacked by Teacher B' }),
      });
      return res.status === 403;
    });

    await test('IDOR Protection: Teacher B CANNOT delete Teacher A product (returns 403)', async () => {
      const res = await fetch(`${BASE_URL}/api/products/${createdProduct.id}`, {
        method: 'DELETE',
        headers: getTestHeaders({
          Cookie: `kryty_session=${tokenB}`,
        }),
      });
      return res.status === 403;
    });

    await test('Frozen Protection: Teacher A account frozen by admin CANNOT edit product (returns 403)', async () => {
      await prisma.user.update({ where: { id: teacherA.id }, data: { isFrozen: true } });
      const res = await fetch(`${BASE_URL}/api/products/${createdProduct.id}`, {
        method: 'PATCH',
        headers: getTestHeaders({
          'Content-Type': 'application/json',
          Cookie: `kryty_session=${tokenA}`,
        }),
        body: JSON.stringify({ title: 'Frozen Edit' }),
      });
      await prisma.user.update({ where: { id: teacherA.id }, data: { isFrozen: false } });
      return res.status === 403;
    });

    // -------------------------------------------------------------------------
    // SECTION 3: PRODUCT RELATIONS & CLEAN CASCADE DELETION
    // -------------------------------------------------------------------------
    console.log('\n--- Section 3: Clean Deletion of Product and All Relations ---');

    // Attach related items: Asset, Review, Comment, ProductView
    const asset = await prisma.productAsset.create({
      data: {
        productId: createdProduct.id,
        title: 'ورقة تمارين شاملة PDF',
        fileUrl: '/uploads/private/sample.pdf',
        fileSizeBytes: 1024,
        fileType: 'PDF',
        isFreePreview: false,
      },
    });

    const review = await prisma.productReview.create({
      data: {
        productId: createdProduct.id,
        userId: student.id,
        rating: 5,
        comment: 'مورد تعليمي ممتاز جداً!',
        status: 'PUBLISHED',
      },
    });

    const comment = await prisma.comment.create({
      data: {
        productId: createdProduct.id,
        userId: student.id,
        content: 'هل يوجد حلول للتمارين؟',
      },
    });

    const pView = await prisma.productView.create({
      data: {
        productId: createdProduct.id,
        viewerId: student.id,
        ipHash: 'test-ip-hash',
      },
    });

    await test('Relations verified created before deletion', async () => {
      const aCount = await prisma.productAsset.count({ where: { productId: createdProduct.id } });
      const rCount = await prisma.productReview.count({ where: { productId: createdProduct.id } });
      const cCount = await prisma.comment.count({ where: { productId: createdProduct.id } });
      const vCount = await prisma.productView.count({ where: { productId: createdProduct.id } });
      return aCount === 1 && rCount === 1 && cCount === 1 && vCount === 1;
    });

    await test('Teacher A deletes product via DELETE /api/products/[id] (HTTP 200)', async () => {
      const res = await fetch(`${BASE_URL}/api/products/${createdProduct.id}`, {
        method: 'DELETE',
        headers: getTestHeaders({
          Cookie: `kryty_session=${tokenA}`,
        }),
      });
      const json = await res.json();
      return res.status === 200 && json.success === true;
    });

    await test('DB verification: Product and all related records cleanly removed without orphan rows', async () => {
      const p = await prisma.product.findUnique({ where: { id: createdProduct.id } });
      const a = await prisma.productAsset.findMany({ where: { productId: createdProduct.id } });
      const r = await prisma.productReview.findMany({ where: { productId: createdProduct.id } });
      const c = await prisma.comment.findMany({ where: { productId: createdProduct.id } });
      const v = await prisma.productView.findMany({ where: { productId: createdProduct.id } });

      return p === null && a.length === 0 && r.length === 0 && c.length === 0 && v.length === 0;
    });

  } finally {
    console.log('\n--- Cleaning up deep test users ---');
    await prisma.teacherProfile.deleteMany({ where: { userId: { in: [teacherA.id, teacherB.id] } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: [teacherA.id, teacherB.id, student.id] } } }).catch(() => {});
    console.log('Cleanup completed.\n');
  }

  console.log('======================================================');
  console.log(`📊 PRODUCT LIFECYCLE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Product deep test fatal error:', err);
  process.exit(1);
});
