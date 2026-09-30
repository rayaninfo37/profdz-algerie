import { hashPassword, verifyPassword, signToken, verifyToken } from '../src/lib/auth';
import { KRYTY_CONFIG, getPlatformSettings } from '../src/lib/config';
import { UserRole, SubscriptionState } from '../src/types';

async function runUnitTests() {
  console.log('--- STARTING KRYTY UNIT REGRESSION SUITE ---');
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => boolean | Promise<boolean>) {
    return Promise.resolve()
      .then(fn)
      .then((res) => {
        if (res) {
          console.log(`  [PASS] ${name}`);
          passed++;
        } else {
          console.error(`  [FAIL] ${name}`);
          failed++;
        }
      })
      .catch((err) => {
        console.error(`  [ERROR] ${name} ->`, err.message);
        failed++;
      });
  }

  // 1. Password Hashing
  await test('Password hashing and verification with bcryptjs', async () => {
    const raw = 'SuperSecret123!';
    const hash = await hashPassword(raw);
    const isValid = await verifyPassword(raw, hash);
    const isInvalid = await verifyPassword('WrongPassword', hash);
    return isValid === true && isInvalid === false && hash.startsWith('$2');
  });

  // 2. JWT Token Signing & Verification
  await test('JWT sign and verify with custom payload and expiration', async () => {
    const payload = {
      userId: 'usr_test_123',
      email: 'test@kryty.dz',
      role: UserRole.TEACHER,
      fullName: 'أستاذ اختباري',
    };
    const token = await signToken(payload);
    const verified = await verifyToken(token);
    return (
      verified !== null &&
      verified.userId === payload.userId &&
      verified.role === UserRole.TEACHER
    );
  });

  // 3. Media Policy Constants & Rules
  await test('Feed media policy enforcement constants', async () => {
    const maxMB = KRYTY_CONFIG.uploadLimits.maxImageSizeMB;
    const maxBytes = KRYTY_CONFIG.uploadLimits.maxImageSizeBytes;
    const allowed = KRYTY_CONFIG.uploadLimits.allowedImageTypes;
    const videoAllowed = KRYTY_CONFIG.uploadLimits.feedVideoAllowed;

    const is5MB = maxMB === 5 && maxBytes === 5 * 1024 * 1024;
    const allowsOnlyImages =
      allowed.includes('image/jpeg') &&
      allowed.includes('image/png') &&
      allowed.includes('image/webp') &&
      !allowed.includes('video/mp4');
    const noFeedVideo = videoAllowed === false;

    return is5MB && allowsOnlyImages && noFeedVideo;
  });

  // 4. Trial & Subscription Configuration
  await test('Free profile trial duration = 30 days & PRO price = 2800 DZD', async () => {
    const settings = await getPlatformSettings();
    return (
      settings.TRIAL_DURATION_DAYS === 30 &&
      settings.PRO_PLAN_PRICE_DZD === 2800
    );
  });

  // 5. Taxonomy Validation
  await test('Algerian coverage 58 wilayas configuration', () => {
    return KRYTY_CONFIG.coverageWilayasCount === 58;
  });

  console.log(`\n--- UNIT SUITE RESULT: ${passed} Passed, ${failed} Failed ---`);
  if (failed > 0) {
    process.exit(1);
  }
}

runUnitTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
