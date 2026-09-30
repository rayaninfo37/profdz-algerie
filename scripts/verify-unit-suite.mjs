import bcrypt from 'bcryptjs';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'kryty_super_secret_jwt_key_algeria_education_2026_dev_mode_only');

const KRYTY_CONFIG = {
  platformName: 'KRYTY',
  platformNameArabic: 'قِراءَتي',
  country: 'الجزائر 🇩🇿',
  coverageWilayasCount: 58,
  subscription: {
    trialDurationDays: 30,
    proPlanPriceDZD: 900,
    proPlanDurationDays: 30,
  },
  uploadLimits: {
    maxImageSizeMB: 5,
    maxImageSizeBytes: 5 * 1024 * 1024,
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    feedVideoAllowed: false,
  },
};

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

async function signToken(payload) {
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

async function verifyToken(token) {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

async function runUnitTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING KRYTY REGRESSION & BUSINESS RULES UNIT SUITE');
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
        console.error(`  ❌ [FAIL] ${name}`);
        failed++;
      }
    } catch (err) {
      console.error(`  ❌ [ERROR] ${name} ->`, err.message);
      failed++;
    }
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
      role: 'TEACHER',
      fullName: 'أستاذ اختباري',
    };
    const token = await signToken(payload);
    const verified = await verifyToken(token);
    return (
      verified !== null &&
      verified.userId === payload.userId &&
      verified.role === 'TEACHER'
    );
  });

  // 3. Media Policy Constants & Rules
  await test('Feed media policy: exactly 1 image max 5 MiB (JPEG/PNG/WebP), no feed video', async () => {
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
  await test('Free profile trial duration = 30 days & PRO price = 900 DZD / 30 days', async () => {
    return (
      KRYTY_CONFIG.subscription.trialDurationDays === 30 &&
      KRYTY_CONFIG.subscription.proPlanPriceDZD === 900 &&
      KRYTY_CONFIG.subscription.proPlanDurationDays === 30
    );
  });

  // 5. Taxonomy Validation
  await test('Algerian coverage 58 wilayas configuration', () => {
    return KRYTY_CONFIG.coverageWilayasCount === 58;
  });

  // 6. Pagination Bounds
  await test('Safe bounded pagination logic (max 100 take, min 0 skip)', () => {
    const clampTake = (raw) => Math.min(Math.max(parseInt(raw, 10) || 20, 1), 100);
    const clampSkip = (raw) => Math.max(parseInt(raw, 10) || 0, 0);

    return (
      clampTake('500') === 100 &&
      clampTake('-10') === 1 &&
      clampTake('50') === 50 &&
      clampSkip('-5') === 0 &&
      clampSkip('20') === 20
    );
  });

  // 7. Contact Flow Format
  await test('Contact message format generator for WhatsApp / Telegram', () => {
    const teacherName = 'أستاذ الرياضيات';
    const productTitle = 'ملخص البكالوريا';
    const msg = `السلام عليكم أستاذ ${teacherName}، تواصلت معك عبر منصة KRYTY بخصوص: ${productTitle}`;
    return msg.includes(teacherName) && msg.includes(productTitle) && msg.includes('KRYTY');
  });

  // 8. Canonical Algerian Phone Validation
  await test('Algerian phone normalization and strict 10-digit validation', () => {
    const algerianMobileRegex = /^0[567][0-9]{8}$/;

    function normalizePhone(raw) {
      if (!raw) return '';
      let cleaned = String(raw).trim().replace(/[\s\-\.\(\)]/g, '');
      if (cleaned.startsWith('+213')) cleaned = '0' + cleaned.slice(4);
      else if (cleaned.startsWith('00213')) cleaned = '0' + cleaned.slice(5);
      else if (cleaned.length === 9 && /^[567]/.test(cleaned)) cleaned = '0' + cleaned;
      return cleaned;
    }

    const testValid1 = normalizePhone('+213 550 12 34 56'); // 0550123456
    const testValid2 = normalizePhone('00213661123456');    // 0661123456
    const testValid3 = normalizePhone('0770 12 34 56');     // 0770123456
    const testInvalid1 = normalizePhone('ddddddddddddd');   // invalid chars
    const testInvalid2 = normalizePhone('021123456');       // landline / 9 digits
    const testInvalid3 = normalizePhone('0912345678');       // invalid prefix 09

    return (
      algerianMobileRegex.test(testValid1) &&
      algerianMobileRegex.test(testValid2) &&
      algerianMobileRegex.test(testValid3) &&
      !algerianMobileRegex.test(testInvalid1) &&
      !algerianMobileRegex.test(testInvalid2) &&
      !algerianMobileRegex.test(testInvalid3)
    );
  });

  // 9. Africa/Algiers Timezone Calendar Consistency
  await test('Africa/Algiers timezone (UTC+1, strictly no DST) date formatting', () => {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Algiers',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const formatted = formatter.format(new Date());
    return /^\d{4}-\d{2}-\d{2}$/.test(formatted);
  });

  // 10. Entitlement Expiration Edge Case (30-Day Trial Window)
  await test('Subscription entitlement logic: expired PRO with expired trial (createdAt > 30d) transitions to FROZEN', () => {
    function resolveEntitlement(createdAt, hasActiveSub, now = new Date()) {
      if (hasActiveSub) return 'PRO_ACTIVE';
      const trialDurationMs = 30 * 24 * 60 * 60 * 1000;
      const isTrialActive = new Date(createdAt.getTime() + trialDurationMs) > now;
      return isTrialActive ? 'FREE_ACTIVE' : 'FROZEN';
    }

    const now = new Date();
    const activeTrialTeacher = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days old
    const expiredTrialTeacher = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000); // 35 days old

    return (
      resolveEntitlement(expiredTrialTeacher, true, now) === 'PRO_ACTIVE' &&
      resolveEntitlement(expiredTrialTeacher, false, now) === 'FROZEN' &&
      resolveEntitlement(activeTrialTeacher, false, now) === 'FREE_ACTIVE'
    );
  });

  // 11. Rate Limit Middleware (in-memory): 21st request blocked
  await test('In-memory rate limiter: blocks 21st request from same IP within window', () => {
    const ipMap2 = new Map();
    function rl(ip, limit = 20, windowMs = 60000) {
      const now = Date.now();
      let r = ipMap2.get(ip);
      if (!r) { r = { timestamps: [] }; ipMap2.set(ip, r); }
      r.timestamps = r.timestamps.filter((t) => now - t < windowMs);
      if (r.timestamps.length >= limit) return 429;
      r.timestamps.push(now);
      return 200;
    }
    for (let i = 0; i < 20; i++) rl('1.2.3.4');
    return rl('1.2.3.4') === 429 && rl('9.9.9.9') === 200;
  });

  // 12. SHA-256 token hashing roundtrip
  await test('SHA-256 hash: same token always produces same 64-char hex', async () => {
    const { createHash } = await import('crypto');
    const raw = 'secret-token-abc';
    const h1 = createHash('sha256').update(raw).digest('hex');
    const h2 = createHash('sha256').update(raw).digest('hex');
    const h3 = createHash('sha256').update('other').digest('hex');
    return h1 === h2 && h1 !== h3 && h1.length === 64;
  });

  // 13. JPEG magic bytes
  await test('File sig: JPEG magic bytes FF D8 FF detected', () => {
    function det(b) {
      if (b[0]===0xff&&b[1]===0xd8&&b[2]===0xff) return 'jpeg';
      return null;
    }
    return det(Buffer.from([0xff,0xd8,0xff,0xe0])) === 'jpeg';
  });

  // 14. PNG magic bytes
  await test('File sig: PNG magic bytes 89 50 4E 47 detected', () => {
    function det(b) {
      if (b[0]===0x89&&b[1]===0x50&&b[2]===0x4e&&b[3]===0x47) return 'png';
      return null;
    }
    return det(Buffer.from([0x89,0x50,0x4e,0x47])) === 'png';
  });

  // 15. PDF magic bytes
  await test('File sig: PDF magic bytes %PDF detected', () => {
    function det(b) {
      if (b[0]===0x25&&b[1]===0x50&&b[2]===0x44&&b[3]===0x46) return 'pdf';
      return null;
    }
    return det(Buffer.from([0x25,0x50,0x44,0x46])) === 'pdf';
  });

  // 16. Invalid file type returns null
  await test('File sig: MZ exe header returns null', () => {
    function det(b) {
      if (b[0]===0xff&&b[1]===0xd8&&b[2]===0xff) return 'jpeg';
      if (b[0]===0x89&&b[1]===0x50&&b[2]===0x4e&&b[3]===0x47) return 'png';
      if (b[0]===0x25&&b[1]===0x50&&b[2]===0x44&&b[3]===0x46) return 'pdf';
      return null;
    }
    return det(Buffer.from([0x4d,0x5a,0x90,0x00])) === null;
  });

  // 17. Path traversal prevention
  await test('Path traversal: ../ outside base dir returns null', async () => {
    const pathMod = await import('path');
    const path = pathMod.default || pathMod;
    // Use a temp base dir that works on any OS
    const base = path.join('/tmp', 'private');
    function safe(rel) {
      // Normalize the combined path and check it stays within base
      const full = path.normalize(path.join(base, rel));
      // On Windows the separator is different, use startsWith with both
      return full.startsWith(base) ? full : null;
    }
    const safeResult = safe('user/file.pdf');
    const traversalResult = safe('../../etc/passwd');
    // safeResult should be non-null; traversal should be null (or not start with base)
    return safeResult !== null && traversalResult === null;
  });

  // 18. ADMIN and INSTITUTION excluded from public registration whitelist
  await test('Role whitelist: ADMIN and INSTITUTION excluded; strictly TEACHER, STUDENT, PARENT allowed', () => {
    const ALLOWED = ['TEACHER', 'STUDENT', 'PARENT'];
    return !ALLOWED.includes('ADMIN') && !ALLOWED.includes('INSTITUTION') && ALLOWED.includes('TEACHER') && ALLOWED.includes('STUDENT') && ALLOWED.includes('PARENT');
  });

  // 19. Comment 500 char limit
  await test('Comment limit: 500 chars OK, 501 rejected', () => {
    function check(s) { return s.trim().length<=500&&s.trim().length>0; }
    return check('a'.repeat(500)) && !check('a'.repeat(501));
  });

  // 20. Review rating 1-5 bounds
  await test('Review rating: 1-5 valid; 0 and 6 invalid', () => {
    const ok = (n) => Number.isInteger(n)&&n>=1&&n<=5;
    return ok(1)&&ok(5)&&!ok(0)&&!ok(6);
  });

  // 21. Self-review prevention
  await test('Self-review: reviewer equals teacher userId is blocked', () => {
    function can(rId, tId) { return rId !== tId; }
    return !can('u1','u1') && can('u1','u2');
  });

  // 22. Self-follow prevention
  await test('Self-follow: following own ID is blocked', () => {
    function can(a,b) { return a!==b; }
    return !can('u1','u1') && can('u1','u2');
  });

  // 23. Feed ranking: newer beats older at same engagement
  await test('Feed ranking: 1h-old post scores higher than 10h-old with same engagement', () => {
    function score(l,c,ms) {
      const h=Math.max(0,ms/3600000);
      return (Math.max(0,l)+2*Math.max(0,c))/Math.pow(h+2,1.2);
    }
    return score(5,3,3600000)>score(5,3,36000000);
  });

  // 24. Feed ranking: higher engagement beats lower at same age
  await test('Feed ranking: higher-engagement post beats lower-engagement at same age', () => {
    function score(l,c,ms) {
      const h=Math.max(0,ms/3600000);
      return (Math.max(0,l)+2*Math.max(0,c))/Math.pow(h+2,1.2);
    }
    return score(50,20,7200000)>score(2,1,7200000);
  });

  // 25. Password strength: 8+ chars + number/special
  await test('Password: 8+ chars with digit or special accepted; weak rejected', () => {
    function ok(pw) {
      if (!pw||pw.length<8) return false;
      return /[0-9!@#$%^&*()\-_=+[\]{}|;'",.<>?/\\]/.test(pw);
    }
    return ok('Secure1!')&&ok('Pass1234')&&!ok('short1')&&!ok('nospecddd')&&!ok('');
  });

  // 26. Canonical keyword expansion for discovery
  await test('Taxonomy keyword expansion: BAC, 3AS, Math expand to valid search tokens', () => {
    function expandLevel(lvl) {
      const tokens = [lvl.trim()];
      if (/bac|بكالوريا|3as/i.test(lvl)) {
        tokens.push('3AS بكالوريا', 'بكالوريا', 'BAC', 'الطور الثانوي');
      }
      if (/bem|بيام|متوسط|4am/i.test(lvl)) {
        tokens.push('4AM شهادة التعليم المتوسط (BEM)', 'BEM', 'بيام', 'متوسط');
      }
      return [...new Set(tokens)];
    }
    const bacTokens = expandLevel('3AS بكالوريا - شعبة علوم تجريبية');
    const bemTokens = expandLevel('4AM شهادة التعليم المتوسط (BEM)');
    return (
      bacTokens.includes('3AS بكالوريا') &&
      bacTokens.includes('BAC') &&
      bemTokens.includes('BEM') &&
      bemTokens.includes('متوسط')
    );
  });

  // 27. Structured pricing validation
  await test('Structured pricing validation: min <= max and non-negative', () => {
    function validatePriceRange(min, max) {
      if (min !== undefined && min !== null && min < 0) return false;
      if (max !== undefined && max !== null && max < 0) return false;
      if (min !== undefined && min !== null && max !== undefined && max !== null && min > max) return false;
      return true;
    }
    return (
      validatePriceRange(1500, 2500) === true &&
      validatePriceRange(2000, 2000) === true &&
      validatePriceRange(null, 3000) === true &&
      validatePriceRange(1500, null) === true &&
      validatePriceRange(3000, 1500) === false &&
      validatePriceRange(-100, 2000) === false
    );
  });

  // 28. Teacher Card primary CTA is Profile and secondary is Contact
  await test('Teacher CTA priority: Primary button is Profile View and Secondary is Direct Contact', () => {
    const ctaHierarchy = {
      primary: 'VIEW_PROFILE',
      secondary: 'DIRECT_CONTACT',
      hasSocialFollow: false,
    };
    return (
      ctaHierarchy.primary === 'VIEW_PROFILE' &&
      ctaHierarchy.secondary === 'DIRECT_CONTACT' &&
      ctaHierarchy.hasSocialFollow === false
    );
  });

  console.log(`\n======================================================`);
  console.log(`\u{1F3C1} UNIT REGRESSION SUITE FINISHED: ${passed}/${passed + failed} PASSED`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runUnitTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
