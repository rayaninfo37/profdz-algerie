import { PrismaClient } from '@prisma/client';
import * as jose from 'jose';
import bcrypt from 'bcryptjs';

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

let ipCounter = 1;
function getTestHeaders(extra = {}) {
  ipCounter++;
  return {
    'X-Forwarded-For': `10.20.${Math.floor(ipCounter / 250)}.${ipCounter % 250 + 1}`,
    ...extra,
  };
}

async function run() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING ACCOUNT PHONE & PASSWORD E2E FOR ALL 4 ROLES');
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

  // Setup test users for each role
  const testPassword = 'Password123!';
  const newPassword = 'NewSecretPassword456#';
  const hashedOriginal = await bcrypt.hash(testPassword, 10);

  const roles = ['TEACHER', 'STUDENT', 'PARENT', 'ADMIN'];
  const testUsers = {};

  for (const role of roles) {
    const email = `test_${role.toLowerCase()}_${Date.now()}_${Math.floor(Math.random() * 10000)}@profdz.test`;
    const initialPhone = '0550' + Math.floor(100000 + Math.random() * 900000);

    const user = await prisma.user.create({
      data: {
        email,
        fullName: `Test ${role} User`,
        role,
        passwordHash: hashedOriginal,
        isEmailVerified: true,
        phone: initialPhone,
        isPhoneVerified: true,
        ...(role === 'TEACHER' ? {
          teacherProfile: {
            create: {
              headline: 'Test Teacher Headline',
              subjects: '[]',
              educationLevels: '[]',
              phone: initialPhone,
              subscriptionState: 'PRO_ACTIVE',
            }
          }
        } : {}),
        ...(role === 'STUDENT' ? {
          studentProfile: {
            create: {
              educationLevel: 'SECONDARY',
              studentType: 'PUPIL_SECONDARY',
            }
          }
        } : {}),
      },
      include: { teacherProfile: true },
    });

    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    });

    testUsers[role] = { user, token, initialPhone };
  }

  try {
    // -------------------------------------------------------------------------
    // TEST SECTION 1: PHONE CHANGE LIFECYCLE FOR ALL 4 ROLES
    // -------------------------------------------------------------------------
    console.log('\n--- Section 1: Phone Change Lifecycle (All 4 Roles) ---');

    for (const role of roles) {
      const { user, token } = testUsers[role];
      const newPhone = '0661' + Math.floor(100000 + Math.random() * 900000);

      // 1. Change phone via API
      await test(`[${role}] Change phone via POST /api/auth/change-phone to valid Algerian number`, async () => {
        const res = await fetch(`${BASE_URL}/api/auth/change-phone`, {
          method: 'POST',
          headers: getTestHeaders({
            'Content-Type': 'application/json',
            Cookie: `kryty_session=${token}`,
          }),
          body: JSON.stringify({ phone: newPhone }),
        });
        const json = await res.json();
        return res.status === 200 && json.success === true;
      });

      // 2. Verify in DB
      await test(`[${role}] DB verification: User.phone updated to ${newPhone} and isPhoneVerified reset`, async () => {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        return dbUser.phone === newPhone && dbUser.isPhoneVerified === false;
      });

      // 3. For TEACHER: verify TeacherProfile.phone === User.phone
      if (role === 'TEACHER') {
        await test(`[TEACHER] DB verification: TeacherProfile.phone synchronized with User.phone`, async () => {
          const teacher = await prisma.teacherProfile.findUnique({ where: { userId: user.id } });
          return teacher.phone === newPhone;
        });
      }

      // 4. Verify uniqueness rejection (another user trying to use the same phone)
      await test(`[${role}] Uniqueness check: Attempting to use existing phone returns 409 Conflict`, async () => {
        const otherRole = roles.find((r) => r !== role);
        const otherUser = testUsers[otherRole];

        const res = await fetch(`${BASE_URL}/api/auth/change-phone`, {
          method: 'POST',
          headers: getTestHeaders({
            'Content-Type': 'application/json',
            Cookie: `kryty_session=${otherUser.token}`,
          }),
          body: JSON.stringify({ phone: newPhone }),
        });
        const json = await res.json();
        return res.status === 409 && json.error.includes('مستخدم');
      });

      // Restore phone verification so login tests work smoothly
      await prisma.user.update({ where: { id: user.id }, data: { isPhoneVerified: true } });
    }

    // -------------------------------------------------------------------------
    // TEST SECTION 2: PASSWORD CHANGE LIFECYCLE FOR ALL 4 ROLES
    // -------------------------------------------------------------------------
    console.log('\n--- Section 2: Password Change Lifecycle (All 4 Roles) ---');

    for (const role of roles) {
      const { user, token } = testUsers[role];

      // 1. Wrong current password rejected
      await test(`[${role}] Change password with incorrect current password returns 400`, async () => {
        const res = await fetch(`${BASE_URL}/api/auth/change-password`, {
          method: 'POST',
          headers: getTestHeaders({
            'Content-Type': 'application/json',
            Cookie: `kryty_session=${token}`,
          }),
          body: JSON.stringify({
            currentPassword: 'WrongPassword999!',
            newPassword: newPassword,
          }),
        });
        const json = await res.json();
        return res.status === 400 && json.error.includes('الحالية غير صحيحة');
      });

      // 2. Weak new password rejected
      await test(`[${role}] Change password with weak new password (< 8 chars) returns 400`, async () => {
        const res = await fetch(`${BASE_URL}/api/auth/change-password`, {
          method: 'POST',
          headers: getTestHeaders({
            'Content-Type': 'application/json',
            Cookie: `kryty_session=${token}`,
          }),
          body: JSON.stringify({
            currentPassword: testPassword,
            newPassword: 'short',
          }),
        });
        return res.status === 400;
      });

      // 3. Successful password change
      await test(`[${role}] Change password with valid credentials succeeds (HTTP 200)`, async () => {
        const res = await fetch(`${BASE_URL}/api/auth/change-password`, {
          method: 'POST',
          headers: getTestHeaders({
            'Content-Type': 'application/json',
            Cookie: `kryty_session=${token}`,
          }),
          body: JSON.stringify({
            currentPassword: testPassword,
            newPassword: newPassword,
          }),
        });
        const json = await res.json();
        const resStr = JSON.stringify(json);
        const hasLeak = resStr.includes(newPassword) || resStr.includes('$2a$') || resStr.includes('$2b$');
        return res.status === 200 && json.success === true && !hasLeak;
      });

      // 4. Verify login with OLD password now fails
      await test(`[${role}] Login with OLD password now FAILS (HTTP 401)`, async () => {
        const res = await fetch(`${BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: getTestHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            email: user.email,
            password: testPassword,
          }),
        });
        return res.status === 401;
      });

      // 5. Verify login with NEW password succeeds
      await test(`[${role}] Login with NEW password SUCCEEDS (HTTP 200)`, async () => {
        const res = await fetch(`${BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: getTestHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            email: user.email,
            password: newPassword,
          }),
        });
        const json = await res.json();
        return res.status === 200 && json.success === true;
      });

      // 6. Verify Audit Log entry created with NO password/hash leakage
      await test(`[${role}] Audit log created for PASSWORD_CHANGED with ZERO password/hash leakage`, async () => {
        const log = await prisma.auditLog.findFirst({
          where: { actorId: user.id, action: 'PASSWORD_CHANGED' },
          orderBy: { createdAt: 'desc' },
        });
        if (!log) return false;
        const detailsStr = log.details || '';
        return !detailsStr.includes(newPassword) && !detailsStr.includes('$2');
      });
    }
  } finally {
    // Cleanup created test users
    console.log('\n--- Cleaning up test users ---');
    for (const role of roles) {
      const { user } = testUsers[role];
      await prisma.auditLog.deleteMany({ where: { actorId: user.id } }).catch(() => {});
      await prisma.studentProfile.deleteMany({ where: { userId: user.id } }).catch(() => {});
      await prisma.teacherProfile.deleteMany({ where: { userId: user.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    }
    console.log('Cleanup completed.\n');
  }

  console.log('======================================================');
  console.log(`📊 ACCOUNTS E2E SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Account E2E Test execution fatal error:', err);
  process.exit(1);
});
