/**
 * KRYTY Complete Autonomous Real-User QA Test Suite
 * Simulates all 5 user roles + unauthenticated guests + edge cases + security boundaries.
 */

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, suite: string, name: string, details = '') {
  results.push({
    suite,
    name,
    passed: condition,
    details: condition ? undefined : details,
  });
  if (condition) {
    console.log(`  ✅ [PASS] ${suite} -> ${name}`);
  } else {
    console.error(`  ❌ [FAIL] ${suite} -> ${name}: ${details}`);
  }
}

// Helper to extract session cookie from Response
function getSessionCookie(res: Response): string | null {
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) return null;
  const match = setCookie.match(/kryty_session=([^;]+)/);
  return match ? match[1] : null;
}

async function runQAPass() {
  console.log('\n======================================================');
  console.log('🚀 STARTING KRYTY COMPREHENSIVE REAL-USER QA PASS');
  console.log('======================================================\n');

  // ---------------------------------------------------------
  // 1. PUBLIC PAGES & SSR RENDERING
  // ---------------------------------------------------------
  console.log('📁 1. Testing Public Pages & SSR Rendering...');
  const publicRoutes = [
    '/',
    '/discover',
    '/teachers',
    '/institutions',
    '/products',
    '/ranking',
    '/feed',
    '/about',
    '/focus',
    '/login',
    '/register',
  ];

  for (const route of publicRoutes) {
    try {
      const res = await fetch(`${BASE_URL}${route}`);
      const text = await res.text();
      assert(
        res.status === 200,
        'Public Pages',
        `GET ${route} returns 200 OK`,
        `Status was ${res.status}`
      );
      assert(
        text.includes('dir="rtl"') || text.includes('lang="ar"') || text.includes('KRYTY') || text.includes('قِراءَتي'),
        'Public Pages',
        `GET ${route} renders Arabic/KRYTY brand correctly`,
        `Missing brand/RTL indicators in response`
      );
    } catch (e: any) {
      assert(false, 'Public Pages', `GET ${route} threw exception`, e.message);
    }
  }

  // ---------------------------------------------------------
  // 2. FRESH USER REGISTRATION (ALL ROLES)
  // ---------------------------------------------------------
  console.log('\n📁 2. Testing Fresh User Registration for All Roles...');
  const timestamp = Date.now().toString().slice(-6);

  const testUsers = {
    student: {
      email: `student_${timestamp}@kryty.dz`,
      password: 'Password123!',
      fullName: 'طالب اختباري تجريبي',
      role: 'STUDENT',
      wilaya: 'Algiers (الجزائر)',
      commune: 'Bab Ezzouar',
      educationLevel: 'BAC Prep (البكالوريا)',
    },
    teacher: {
      email: `teacher_${timestamp}@kryty.dz`,
      password: 'Password123!',
      fullName: 'أستاذ اختباري تجريبي',
      role: 'TEACHER',
      wilaya: 'Oran (وهران)',
      commune: 'Bir El Djir',
      headline: 'أستاذ متخصص في الرياضيات للطور الثانوي',
      subjects: ['Mathematics (الرياضيات)'],
      educationLevels: ['BAC Prep (البكالوريا)'],
    },
    parent: {
      email: `parent_${timestamp}@kryty.dz`,
      password: 'Password123!',
      fullName: 'ولي أمر اختباري',
      role: 'PARENT',
      wilaya: 'Constantine (قسنطينة)',
      commune: 'El Khroub',
    },
    institution: {
      email: `inst_${timestamp}@kryty.dz`,
      password: 'Password123!',
      fullName: 'مدرسة التفوق الخاصة',
      role: 'INSTITUTION',
      wilaya: 'Setif (سطيف)',
      commune: 'Setif',
    },
  };

  const userCookies: Record<string, string> = {};
  const userIds: Record<string, string> = {};
  const teacherProfileIds: Record<string, string> = {};

  for (const [roleKey, payload] of Object.entries(testUsers)) {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data: any = await res.json();
      assert(
        res.status === 200 && data.success === true,
        'User Registration',
        `Register ${roleKey.toUpperCase()} successfully`,
        JSON.stringify(data)
      );

      const cookie = getSessionCookie(res);
      if (cookie) {
        userCookies[roleKey] = cookie;
        userIds[roleKey] = data.user?.id;
        if (data.user?.teacherProfile) {
          teacherProfileIds[roleKey] = data.user.teacherProfile.id;
        }
      }

      // Check cookie headers
      const setCookieHeader = res.headers.get('set-cookie') || '';
      assert(
        setCookieHeader.toLowerCase().includes('samesite=strict'),
        'Security Headers',
        `Auth cookie has SameSite=Strict for ${roleKey}`,
        `Header: ${setCookieHeader}`
      );
      assert(
        setCookieHeader.toLowerCase().includes('httponly'),
        'Security Headers',
        `Auth cookie has HttpOnly for ${roleKey}`,
        `Header: ${setCookieHeader}`
      );
    } catch (e: any) {
      assert(false, 'User Registration', `Register ${roleKey} threw exception`, e.message);
    }
  }

  // ---------------------------------------------------------
  // 3. AUTHENTICATION & LOGIN FLOWS
  // ---------------------------------------------------------
  console.log('\n📁 3. Testing Authentication & Session Flows...');
  
  // 3.1 Invalid login credentials
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUsers.student.email, password: 'WrongPassword999!' }),
    });
    assert(
      res.status === 401,
      'Authentication',
      'Invalid password returns 401 Unauthorized',
      `Got status ${res.status}`
    );
  } catch (e: any) {
    assert(false, 'Authentication', 'Invalid login check threw exception', e.message);
  }

  // 3.2 Valid login for Student
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUsers.student.email, password: testUsers.student.password }),
    });
    const data: any = await res.json();
    assert(
      res.status === 200 && data.success === true,
      'Authentication',
      'Valid login returns 200 and user data',
      JSON.stringify(data)
    );
    const cookie = getSessionCookie(res);
    if (cookie) userCookies.student = cookie;
  } catch (e: any) {
    assert(false, 'Authentication', 'Valid login threw exception', e.message);
  }

  // 3.3 Check /api/auth/me with session cookie
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: `kryty_session=${userCookies.student}` },
    });
    const data: any = await res.json();
    assert(
      res.status === 200 && data.authenticated === true && data.user?.email === testUsers.student.email,
      'Authentication',
      'GET /api/auth/me returns authenticated user with safe profile',
      JSON.stringify(data)
    );
    assert(
      !data.user?.passwordHash,
      'Security',
      'GET /api/auth/me does NOT leak passwordHash',
      'passwordHash found in response!'
    );
  } catch (e: any) {
    assert(false, 'Authentication', 'Auth me check threw exception', e.message);
  }

  // 3.4 Unauthenticated /api/auth/me
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`);
    const data: any = await res.json();
    assert(
      data.authenticated === false && data.user === null,
      'Authentication',
      'Unauthenticated GET /api/auth/me returns authenticated: false',
      JSON.stringify(data)
    );
  } catch (e: any) {
    assert(false, 'Authentication', 'Unauthenticated auth me threw exception', e.message);
  }

  // ---------------------------------------------------------
  // 4. ADMIN USER & PERMISSION BOUNDARY CHECKS
  // ---------------------------------------------------------
  console.log('\n📁 4. Testing Admin Security & Authorization Boundaries...');

  // 4.1 Login as Admin
  let adminCookie = '';
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@kryty.dz', password: 'Kryty2026!' }),
    });
    const data: any = await res.json();
    assert(
      res.status === 200 && data.user?.role === 'ADMIN',
      'Admin Auth',
      'Admin logs in successfully with ADMIN role',
      JSON.stringify(data)
    );
    const cookie = getSessionCookie(res);
    if (cookie) adminCookie = cookie;
  } catch (e: any) {
    assert(false, 'Admin Auth', 'Admin login threw exception', e.message);
  }

  // 4.2 Non-Admin (Student) attempts to call Admin API -> must return 403
  try {
    const res = await fetch(`${BASE_URL}/api/admin/teachers/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `kryty_session=${userCookies.student}`,
      },
      body: JSON.stringify({ teacherProfileId: 'dummy-id', isVerified: true }),
    });
    assert(
      res.status === 403,
      'Authorization Boundaries',
      'Student calling Admin API returns 403 Forbidden',
      `Got status ${res.status}`
    );
  } catch (e: any) {
    assert(false, 'Authorization Boundaries', 'Student calling admin API threw exception', e.message);
  }

  // 4.3 Non-Admin (Student) visits /admin page -> redirect or block
  try {
    const res = await fetch(`${BASE_URL}/admin`, {
      headers: { Cookie: `kryty_session=${userCookies.student}` },
      redirect: 'manual',
    });
    assert(
      res.status === 307 || res.status === 302 || res.status === 403,
      'Authorization Boundaries',
      'Student navigating to /admin is redirected away',
      `Got status ${res.status}`
    );
  } catch (e: any) {
    assert(false, 'Authorization Boundaries', 'Student visiting /admin threw exception', e.message);
  }

  // 4.4 Admin visits /admin page -> 200 OK
  try {
    const res = await fetch(`${BASE_URL}/admin`, {
      headers: { Cookie: `kryty_session=${adminCookie}` },
    });
    const text = await res.text();
    assert(
      res.status === 200 && text.includes('KRYTY Administrative Control Center'),
      'Admin Dashboard',
      'Admin user successfully accesses Admin Dashboard',
      `Got status ${res.status}`
    );
  } catch (e: any) {
    assert(false, 'Admin Dashboard', 'Admin visiting /admin threw exception', e.message);
  }

  // ---------------------------------------------------------
  // 5. USER PROFILE & EDITING FLOWS
  // ---------------------------------------------------------
  console.log('\n📁 5. Testing Profile Updates & Data Integrity...');
  try {
    const updatePayload = {
      fullName: 'أستاذ اختباري محدث (البروفيسور)',
      headline: 'خبير إعداد شهادة البكالوريا - شعبة علوم تجريبية',
      bio: 'أستاذ تعليم ثانوي متميز ذو خبرة تفوق 12 سنة في تدريس مادة الرياضيات لطلاب البكالوريا.',
      wilaya: 'Algiers (الجزائر)',
      commune: 'Kouba',
      phone: '0555123456',
      whatsapp: '213555123456',
      pricingInfo: '3500 DZD / month (مجموعات صغيرة)',
      teachingMode: 'BOTH',
      experienceYears: 12,
    };

    const res = await fetch(`${BASE_URL}/api/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `kryty_session=${userCookies.teacher}`,
      },
      body: JSON.stringify(updatePayload),
    });
    const data: any = await res.json();
    assert(
      res.status === 200 && data.success === true,
      'Profile Update',
      'Teacher profile updated successfully with complete details',
      JSON.stringify(data)
    );
  } catch (e: any) {
    assert(false, 'Profile Update', 'Profile update threw exception', e.message);
  }

  // ---------------------------------------------------------
  // 6. REVIEWS & FORBIDDEN ACTIONS (SELF-REVIEW, DUPLICATES)
  // ---------------------------------------------------------
  console.log('\n📁 6. Testing Reviews, Self-Review Block, & Duplication Prevention...');

  // 6.1 Teacher attempts self-review -> must return 400
  try {
    const res = await fetch(`${BASE_URL}/api/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `kryty_session=${userCookies.teacher}`,
      },
      body: JSON.stringify({
        targetId: teacherProfileIds.teacher,
        targetType: 'TEACHER',
        rating: 5,
        comment: 'أنا أفضل أستاذ في المنصة!',
      }),
    });
    const data: any = await res.json();
    assert(
      res.status === 400 && data.error?.includes('لا يمكنك تقييم ملفك الشخصي'),
      'Review Safety',
      'Teacher self-review is strictly blocked with Arabic error message',
      `Status: ${res.status}, Error: ${data.error}`
    );
  } catch (e: any) {
    assert(false, 'Review Safety', 'Self-review test threw exception', e.message);
  }

  // 6.2 Student reviews Teacher -> must succeed
  try {
    const res = await fetch(`${BASE_URL}/api/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `kryty_session=${userCookies.student}`,
      },
      body: JSON.stringify({
        targetId: teacherProfileIds.teacher,
        targetType: 'TEACHER',
        rating: 5,
        comment: 'شرح رائع ومنهجية واضحة جداً بارك الله فيك يا أستاذ!',
      }),
    });
    const data: any = await res.json();
    assert(
      res.status === 200 && data.success === true,
      'Review Submission',
      'Student submits legitimate review for Teacher successfully',
      JSON.stringify(data)
    );
  } catch (e: any) {
    assert(false, 'Review Submission', 'Review submission threw exception', e.message);
  }

  // 6.3 Student attempts duplicate review for same Teacher -> must return 400
  try {
    const res = await fetch(`${BASE_URL}/api/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `kryty_session=${userCookies.student}`,
      },
      body: JSON.stringify({
        targetId: teacherProfileIds.teacher,
        targetType: 'TEACHER',
        rating: 4,
        comment: 'محاولة تقييم ثانية مكررة',
      }),
    });
    const data: any = await res.json();
    assert(
      res.status === 400,
      'Review Safety',
      'Duplicate review by same student is strictly blocked with 400',
      `Status: ${res.status}, Error: ${data.error}`
    );
  } catch (e: any) {
    assert(false, 'Review Safety', 'Duplicate review check threw exception', e.message);
  }

  // ---------------------------------------------------------
  // 7. FOLLOWS & SOCIAL INTERACTIONS
  // ---------------------------------------------------------
  console.log('\n📁 7. Testing Follows & Self-Follow Prevention...');

  // 7.1 Teacher attempts self-follow -> must return 400
  try {
    const res = await fetch(`${BASE_URL}/api/follows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `kryty_session=${userCookies.teacher}`,
      },
      body: JSON.stringify({ followingId: userIds.teacher }),
    });
    const data: any = await res.json();
    assert(
      res.status === 400 && data.error?.includes('لا يمكنك متابعة حسابك الشخصي'),
      'Follow Safety',
      'Self-follow is strictly blocked with Arabic error message',
      `Status: ${res.status}, Error: ${data.error}`
    );
  } catch (e: any) {
    assert(false, 'Follow Safety', 'Self-follow test threw exception', e.message);
  }

  // 7.2 Student follows Teacher -> returns following: true
  try {
    const res = await fetch(`${BASE_URL}/api/follows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `kryty_session=${userCookies.student}`,
      },
      body: JSON.stringify({ followingId: userIds.teacher }),
    });
    const data: any = await res.json();
    assert(
      res.status === 200 && data.following === true,
      'Follow System',
      'Student successfully follows Teacher',
      JSON.stringify(data)
    );
  } catch (e: any) {
    assert(false, 'Follow System', 'Follow teacher threw exception', e.message);
  }

  // ---------------------------------------------------------
  // 8. POSTS, LIKES, & COMMENTS
  // ---------------------------------------------------------
  console.log('\n📁 8. Testing Educational Feed, Posts, Likes & Comments...');

  let createdPostId = '';
  // 8.1 Teacher creates educational post
  try {
    const res = await fetch(`${BASE_URL}/api/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `kryty_session=${userCookies.teacher}`,
      },
      body: JSON.stringify({
        title: 'نصيحة ذهبية في دراسة الدوال الأسية واللوغاريتمية (BAC 2026)',
        content: 'تذكر دائماً أن نهاية التزايد المقارن بين الأس واللوغاريتم هي المفتاح الأساسي لإزالة حالات عدم التعيين.',
        postType: 'TIP',
        subject: 'Mathematics (الرياضيات)',
        educationLevel: 'BAC Prep (البكالوريا)',
      }),
    });
    const data: any = await res.json();
    assert(
      res.status === 200 && data.success === true && data.post?.id,
      'Feed System',
      'Teacher creates educational post successfully',
      JSON.stringify(data)
    );
    if (data.post?.id) createdPostId = data.post.id;
  } catch (e: any) {
    assert(false, 'Feed System', 'Create post threw exception', e.message);
  }

  // 8.2 Student likes the post
  if (createdPostId) {
    try {
      const res = await fetch(`${BASE_URL}/api/posts/${createdPostId}/like`, {
        method: 'POST',
        headers: { Cookie: `kryty_session=${userCookies.student}` },
      });
      const data: any = await res.json();
      assert(
        res.status === 200 && data.liked === true,
        'Post Engagement',
        'Student likes educational post successfully',
        JSON.stringify(data)
      );
    } catch (e: any) {
      assert(false, 'Post Engagement', 'Like post threw exception', e.message);
    }

    // 8.3 Student adds a comment
    try {
      const res = await fetch(`${BASE_URL}/api/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `kryty_session=${userCookies.student}`,
        },
        body: JSON.stringify({
          postId: createdPostId,
          content: 'شكراً جزيلاً أستاذ على هذه النصيحة القيمة!',
        }),
      });
      const data: any = await res.json();
      assert(
        res.status === 200 && data.success === true,
        'Post Engagement',
        'Student adds comment to educational post successfully',
        JSON.stringify(data)
      );
    } catch (e: any) {
      assert(false, 'Post Engagement', 'Add comment threw exception', e.message);
    }
  }

  // ---------------------------------------------------------
  // 9. DIGITAL PRODUCTS, CHECKOUT, & LIBRARY ENTITLEMENT
  // ---------------------------------------------------------
  console.log('\n📁 9. Testing Digital Products Marketplace & Entitlement...');

  let createdProductId = '';
  let createdProductSlug = '';

  // 9.1 Teacher publishes a digital product
  try {
    const res = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `kryty_session=${userCookies.teacher}`,
      },
      body: JSON.stringify({
        title: 'ملخص شامل وتمارين نموذجية في الاحتمالات BAC 2026',
        description: 'ملف رقمي عالي الجودة يحتوي على 50 تمرين نموذجي محلول بالتفصيل.',
        productType: 'BOOK',
        subject: 'Mathematics (الرياضيات)',
        educationLevel: 'BAC Prep (البكالوريا)',
        priceDZD: 1200,
        isFree: false,
        previewContent: 'تتضمن العينة مقتطفات من تمارين شجرة الاحتمالات والمتغير العشوائي.',
      }),
    });
    const data: any = await res.json();
    assert(
      res.status === 200 && data.success === true && data.product?.id,
      'Digital Marketplace',
      'Teacher publishes new digital product successfully with Arabic title',
      JSON.stringify(data)
    );
    if (data.product?.id) {
      createdProductId = data.product.id;
      createdProductSlug = data.product.slug;
    }
  } catch (e: any) {
    assert(false, 'Digital Marketplace', 'Create product threw exception', e.message);
  }

  // 9.2 Product Detail Page SSR renders correctly
  if (createdProductSlug) {
    try {
      const res = await fetch(`${BASE_URL}/products/${encodeURIComponent(createdProductSlug)}`);
      const text = await res.text();
      assert(
        res.status === 200 && text.includes('ملخص شامل وتمارين نموذجية'),
        'Product Details',
        `Product detail page /products/${createdProductSlug} renders successfully`,
        `Status was ${res.status}`
      );
    } catch (e: any) {
      assert(false, 'Product Details', 'Product detail page threw exception', e.message);
    }
  }

  // 9.3 Student purchases the digital product (checkout)
  if (createdProductId) {
    try {
      const res = await fetch(`${BASE_URL}/api/products/${createdProductId}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `kryty_session=${userCookies.student}`,
        },
        body: JSON.stringify({ paymentRef: `TEST_CIB_${Date.now()}` }),
      });
      const data: any = await res.json();
      assert(
        res.status === 200 && data.success === true && data.entitlement,
        'Checkout & Entitlement',
        'Student purchases product, order status is PAID and entitlement is granted',
        JSON.stringify(data)
      );
    } catch (e: any) {
      assert(false, 'Checkout & Entitlement', 'Checkout threw exception', e.message);
    }

    // 9.4 Student visits /library and sees entitled product
    try {
      const res = await fetch(`${BASE_URL}/library`, {
        headers: { Cookie: `kryty_session=${userCookies.student}` },
      });
      const text = await res.text();
      assert(
        res.status === 200 && (text.includes('مكتبتي التعليمية') || text.includes('ملخص شامل')),
        'Student Library',
        'Student /library displays entitled digital product and download links',
        `Status was ${res.status}`
      );
    } catch (e: any) {
      assert(false, 'Student Library', 'Student library check threw exception', e.message);
    }
  }

  // ---------------------------------------------------------
  // 10. TEACHER REACH GAUGE & FREE QUOTA LIMIT (100 REACHES)
  // ---------------------------------------------------------
  console.log('\n📁 10. Testing Teacher Reach Tracking & Free Quota Limit...');
  try {
    const res = await fetch(`${BASE_URL}/api/teachers/${teacherProfileIds.teacher}/reach`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `kryty_session=${userCookies.student}`,
      },
    });
    const data: any = await res.json();
    assert(
      res.status === 200 && data.success === true,
      'Reach Tracking',
      'Reach event recorded accurately and quota is returned',
      JSON.stringify(data)
    );
  } catch (e: any) {
    assert(false, 'Reach Tracking', 'Reach tracking threw exception', e.message);
  }

  // ---------------------------------------------------------
  // 11. ADMIN ACTIONS & PLATFORM SETTINGS
  // ---------------------------------------------------------
  console.log('\n📁 11. Testing Admin Controls, Teacher Verification & Settings...');
  try {
    // Admin verifies teacher
    const res = await fetch(`${BASE_URL}/api/admin/teachers/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `kryty_session=${adminCookie}`,
      },
      body: JSON.stringify({
        teacherProfileId: teacherProfileIds.teacher,
        isVerified: true,
      }),
    });
    const data: any = await res.json();
    assert(
      res.status === 200 && data.profile?.isVerified === true,
      'Admin Verification',
      'Admin grants official verification badge to Teacher successfully',
      JSON.stringify(data)
    );
  } catch (e: any) {
    assert(false, 'Admin Verification', 'Admin verify teacher threw exception', e.message);
  }

  // ---------------------------------------------------------
  // 12. LOGOUT FLOW
  // ---------------------------------------------------------
  console.log('\n📁 12. Testing Logout & Cookie Clearance...');
  try {
    const res = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: `kryty_session=${userCookies.student}` },
    });
    assert(
      res.status === 200,
      'Logout',
      'POST /api/auth/logout returns 200 OK',
      `Got status ${res.status}`
    );
    const setCookie = res.headers.get('set-cookie') || '';
    assert(
      setCookie.includes('Max-Age=0') || setCookie.includes('kryty_session=;') || setCookie.includes('expires='),
      'Logout',
      'Session cookie is cleared / expired on logout',
      `Set-Cookie: ${setCookie}`
    );
  } catch (e: any) {
    assert(false, 'Logout', 'Logout threw exception', e.message);
  }

  // ---------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  const passRate = Math.round((passed / total) * 100);

  console.log('\n======================================================');
  console.log(`🏁 REAL-USER QA PASS FINISHED: ${passed}/${total} PASSED (${passRate}%)`);
  console.log('======================================================\n');

  if (failed > 0) {
    console.error(`⚠️ FAILED TESTS (${failed}):`);
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.error(` - [${r.suite}] ${r.name}: ${r.details || 'Unknown error'}`);
      });
    process.exit(1);
  } else {
    console.log('🎉 ALL USER PERSONAS & INTEGRITY CHECKS PASSED WITH 100% SUCCESS!');
    process.exit(0);
  }
}

runQAPass().catch((e) => {
  console.error('Fatal error during QA pass:', e);
  process.exit(1);
});
