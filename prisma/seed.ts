import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting KRYTY Algerian Educational Seed Data Insertion...');

  const passwordHash = await bcrypt.hash('Kryty2026!', 10);

  // 1. Admin User
  await prisma.user.upsert({
    where: { email: 'admin@kryty.dz' },
    update: {},
    create: {
      email: 'admin@kryty.dz',
      passwordHash,
      fullName: 'KRYTY System Administrator',
      role: 'ADMIN',
      wilaya: 'Algiers (الجزائر)',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  });

  // 2. Institution User & Profile
  const instUser = await prisma.user.upsert({
    where: { email: 'elnadjah@kryty.dz' },
    update: {},
    create: {
      email: 'elnadjah@kryty.dz',
      passwordHash,
      fullName: 'El-Nadjah Academy Algiers',
      role: 'INSTITUTION',
      wilaya: 'Algiers (الجزائر)',
      avatarUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=150&auto=format&fit=crop&q=80',
    },
  });

  const institutionProfile = await prisma.institutionProfile.upsert({
    where: { userId: instUser.id },
    update: {},
    create: {
      userId: instUser.id,
      name: 'El-Nadjah Academy Algiers (أكاديمية النجاح)',
      description: 'Premier private educational institution in Hydra, Algiers specializing in BAC and BEM excellence with top national professors.',
      address: 'Route de Hydra, Villa 14, Algiers',
      phone: '+213 23 48 12 90',
      website: 'https://elnadjah-academy.dz',
      isVerified: true,
    },
  });

  // 3. Teachers
  // Teacher 1: Prof. Yassine Benali (Math)
  const teacher1User = await prisma.user.upsert({
    where: { email: 'yassine.benali@kryty.dz' },
    update: {},
    create: {
      email: 'yassine.benali@kryty.dz',
      passwordHash,
      fullName: 'Prof. Yassine Benali (أستاذ ياسين بن علي)',
      role: 'TEACHER',
      wilaya: 'Algiers (الجزائر)',
      avatarUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=300&auto=format&fit=crop&q=80',
    },
  });

  const teacher1Profile = await prisma.teacherProfile.upsert({
    where: { userId: teacher1User.id },
    update: {},
    create: {
      userId: teacher1User.id,
      headline: 'Senior Mathematics Professor | BAC Specialist (15 Years Exp)',
      bio: 'Ex-National BAC Inspector and lead author of Mathematics exam guides. Specialized in preparing 3AS students for top distinction in BAC Maths.',
      subjects: JSON.stringify(['Mathematics (الرياضيات)']),
      educationLevels: JSON.stringify(['BAC Prep (البكالوريا)', 'Secondary (الثانوي)']),
      teachingMode: 'BOTH',
      experienceYears: 15,
      qualifications: 'Magister in Applied Mathematics, University of Algiers USTHB',
      pricingInfo: '3,500 DZD / month (Group classes in Kouba & Hydra) | Online via Zoom',
      availability: 'Saturday, Tuesday & Thursday afternoons',
      languages: JSON.stringify(['Arabic', 'French']),
      isVerified: true,
      subscriptionState: 'PRO_ACTIVE',
      phone: '+213 555 12 34 56',
      whatsapp: '+213 555 12 34 56',
      telegram: 't.me/prof_yassine_math',
      facebook: 'facebook.com/profyassine.math',
      institutionId: institutionProfile.id,
    },
  });

  // Teacher 2: Dr. Amel Belkacem (Physics)
  const teacher2User = await prisma.user.upsert({
    where: { email: 'amel.belkacem@kryty.dz' },
    update: {},
    create: {
      email: 'amel.belkacem@kryty.dz',
      passwordHash,
      fullName: 'Dr. Amel Belkacem (دكتورة أمل بلقاسم)',
      role: 'TEACHER',
      wilaya: 'Oran (وهران)',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    },
  });

  const teacher2Profile = await prisma.teacherProfile.upsert({
    where: { userId: teacher2User.id },
    update: {},
    create: {
      userId: teacher2User.id,
      headline: 'Physics & Chemistry Expert | University Lecturer (12 Years Exp)',
      bio: 'Doctor in Theoretical Physics, empowering secondary students to master nuclear physics, electrical circuits, and chemical reactions with ease.',
      subjects: JSON.stringify(['Physics & Chemistry (الفيزياء والكيمياء)']),
      educationLevels: JSON.stringify(['BAC Prep (البكالوريا)', 'Secondary (الثانوي)']),
      teachingMode: 'BOTH',
      experienceYears: 12,
      qualifications: 'PhD in Physics, University of Oran 1 Ahmed Ben Bella',
      pricingInfo: '3,000 DZD / month',
      availability: 'Fridays & Mondays',
      languages: JSON.stringify(['Arabic', 'French', 'English']),
      isVerified: true,
      subscriptionState: 'PRO_ACTIVE',
      phone: '+213 661 98 76 54',
      whatsapp: '+213 661 98 76 54',
      telegram: 't.me/dr_amel_physics',
    },
  });

  // Teacher 3: Prof. Karim Djebbar (Natural Sciences)
  const teacher3User = await prisma.user.upsert({
    where: { email: 'karim.djebbar@kryty.dz' },
    update: {},
    create: {
      email: 'karim.djebbar@kryty.dz',
      passwordHash,
      fullName: 'Prof. Karim Djebbar (أستاذ كريم جبار)',
      role: 'TEACHER',
      wilaya: 'Sétif (سطيف)',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    },
  });

  await prisma.teacherProfile.upsert({
    where: { userId: teacher3User.id },
    update: {},
    create: {
      userId: teacher3User.id,
      headline: 'Natural Sciences Senior Teacher (14 Years Exp)',
      bio: 'Specialist in scientific method analysis, genetics, and immunology for BAC Experimental Sciences & Math streams.',
      subjects: JSON.stringify(['Natural Sciences (علوم الطبيعة والحياة)']),
      educationLevels: JSON.stringify(['BAC Prep (البكالوريا)']),
      teachingMode: 'IN_PERSON',
      experienceYears: 14,
      qualifications: 'Bachelor in Biology & Education, Sétif University',
      pricingInfo: '2,800 DZD / month',
      availability: 'Wednesdays & Saturdays',
      languages: JSON.stringify(['Arabic', 'French']),
      isVerified: true,
      subscriptionState: 'FREE_ACTIVE',
      phone: '+213 770 44 55 66',
      whatsapp: '+213 770 44 55 66',
    },
  });

  // 4. Student & Parent Users
  const studentUser = await prisma.user.upsert({
    where: { email: 'student.zinedine@kryty.dz' },
    update: {},
    create: {
      email: 'student.zinedine@kryty.dz',
      passwordHash,
      fullName: 'Zinedine Zidane (طالب زين الدين)',
      role: 'STUDENT',
      wilaya: 'Algiers (الجزائر)',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    },
  });

  await prisma.studentProfile.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      educationLevel: 'BAC Prep (البكالوريا)',
      interests: JSON.stringify(['Mathematics (الرياضيات)', 'Physics & Chemistry (الفيزياء والكيمياء)']),
    },
  });

  const parentUser = await prisma.user.upsert({
    where: { email: 'parent.fatima@kryty.dz' },
    update: {},
    create: {
      email: 'parent.fatima@kryty.dz',
      passwordHash,
      fullName: 'Fatima Zohra (ولي الأمر فاطمة الزهراء)',
      role: 'PARENT',
      wilaya: 'Algiers (الجزائر)',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    },
  });

  await prisma.parentProfile.upsert({
    where: { userId: parentUser.id },
    update: {},
    create: {
      userId: parentUser.id,
      budgetRange: '3,000 - 5,000 DZD / month per subject',
    },
  });

  // 5. Educational Posts
  const existingPost1 = await prisma.post.findFirst({
    where: { authorId: teacher1User.id, title: 'BAC 2026 Math: 5 Essential Golden Rules for Complex Numbers (الأعداد المركبة)' }
  });
  if (!existingPost1) {
    await prisma.post.create({
      data: {
        authorId: teacher1User.id,
        title: 'BAC 2026 Math: 5 Essential Golden Rules for Complex Numbers (الأعداد المركبة)',
        content: `تعتبر الأعداد المركبة من أهم المحاور في امتحان البكالوريا شعبة علوم تجريبية ورياضيات.
إليك 5 قواعد ذهبية لا يجب أن تنساها يوم الامتحان:
1. التعبير عن الشكل المثلثي والشكل الأسي بدقة متناهية.
2. استخدام خواص العمدة (Argument) لحساب الزوايا والتحويلات النقطية.
3. التمييز بين الانسحاب، الدوران، والتحاكي من خلال المعادلة المركبة z' = az + b.
4. إثبات أن مجموعة النقط تمثل دائرة أو مستقيماً باستخدام المرافق.
5. التدرب على حساب قوى العدد z الأسي باستخدام صيغة مويفر (De Moivre).`,
        postType: 'TIP',
        subject: 'Mathematics (الرياضيات)',
        educationLevel: 'BAC Prep (البكالوريا)',
        viewsCount: 340,
      },
    });
  }

  const existingPost2 = await prisma.post.findFirst({
    where: { authorId: teacher2User.id, title: 'Physics BAC Tip: Nuclear Reactions & Mass Defect (التفاعلات النووية والنقص الكتلي)' }
  });
  if (!existingPost2) {
    await prisma.post.create({
      data: {
        authorId: teacher2User.id,
        title: 'Physics BAC Tip: Nuclear Reactions & Mass Defect (التفاعلات النووية والنقص الكتلي)',
        content: `الكثير من التلاميذ يقعون في خطأ التحويل بين وحدة الكتل الذرية (u) وميغا إلكترون فولط (MeV).
تذكر دائماً القاعدة التالية:
1 u = 931.5 MeV/c²
لحساب طاقة الربط (Elib):
Elib = Δm × 931.5 MeV
حيث Δm بالنغرام أو وحدة الكتل الذرية u. راجع تمارين البكالوريا السابقة لتفادي أخطاء الحساب!`,
        postType: 'EXPLANATION',
        subject: 'Physics & Chemistry (الفيزياء والكيمياء)',
        educationLevel: 'BAC Prep (البكالوريا)',
        viewsCount: 215,
      },
    });
  }

  // 6. Reviews
  await prisma.review.upsert({
    where: {
      authorId_targetId: {
        authorId: studentUser.id,
        targetId: teacher1Profile.id,
      },
    },
    update: {},
    create: {
      targetId: teacher1Profile.id,
      targetType: 'TEACHER',
      authorId: studentUser.id,
      rating: 5,
      comment: 'أستاذ ممتاااااز جداً! الشرح مبسط والتمارين الشاملة مكنتني من الحصول على 19.5 في الرياضيات في الاختبار التجريبي.',
      status: 'PUBLISHED',
    },
  });

  // 7. Digital Products
  await prisma.product.upsert({
    where: { slug: 'bac-2026-mathematics-master-guide' },
    update: {},
    create: {
      creatorId: teacher1Profile.id,
      creatorName: 'Prof. Yassine Benali',
      creatorType: 'TEACHER',
      title: 'BAC 2026 Mathematics Master Guide (دليل النجاح في الرياضيات)',
      slug: 'bac-2026-mathematics-master-guide',
      description: 'Comprehensive 240-page digital book containing complete theory, 150 solved exercises, and 15 full BAC mock exams with step-by-step solutions.',
      coverImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=500&auto=format&fit=crop&q=80',
      productType: 'BOOK',
      subject: 'Mathematics (الرياضيات)',
      educationLevel: 'BAC Prep (البكالوريا)',
      priceDZD: 1500,
      isFree: false,
      previewContent: 'Free Sample Preview: Chapter 1 - Functions & Limits (15 pages excerpt with 5 fully solved exercises). Download sample PDF inside.',
      isPublished: true,
      assets: {
        create: [
          {
            title: 'Sample Excerpt - Chapter 1 (Free Preview)',
            fileUrl: '/assets/sample-math-ch1.pdf',
            fileType: 'PDF',
            isFreePreview: true,
          },
          {
            title: 'Full Master Guide BAC 2026 (Protected)',
            fileUrl: '/assets/protected-math-master-guide-2026.pdf',
            fileType: 'PDF',
            isFreePreview: false,
          },
        ],
      },
    },
  });

  await prisma.product.upsert({
    where: { slug: 'physics-chemistry-bac-pack-2026' },
    update: {},
    create: {
      creatorId: teacher2Profile.id,
      creatorName: 'Dr. Amel Belkacem',
      creatorType: 'TEACHER',
      title: 'Physics & Chemistry BAC Pack 2026 (حقيبة الفيزياء والكيمياء)',
      slug: 'physics-chemistry-bac-pack-2026',
      description: 'Complete digital video course and exercise pack covering all 6 units of the BAC physics syllabus.',
      coverImage: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=500&auto=format&fit=crop&q=80',
      productType: 'COURSE',
      subject: 'Physics & Chemistry (الفيزياء والكيمياء)',
      educationLevel: 'BAC Prep (البكالوريا)',
      priceDZD: 2200,
      isFree: false,
      previewContent: 'Video Sample Preview: Unit 1 Chemical Kinetics (10 min video intro) + Solved Revision Sheet.',
      isPublished: true,
      assets: {
        create: [
          {
            title: 'Intro & Unit 1 Summary (Free Preview)',
            fileUrl: '/assets/sample-physics-unit1.pdf',
            fileType: 'PDF',
            isFreePreview: true,
          },
          {
            title: 'Complete BAC Physics Course & Videos',
            fileUrl: '/assets/protected-physics-course-full.pdf',
            fileType: 'PDF',
            isFreePreview: false,
          },
        ],
      },
      modules: {
        create: [
          {
            title: 'الوحدة 1: المتابعة الزمنية لتحول كيميائي',
            order: 1,
            lessons: {
              create: [
                {
                  title: 'الدرس 1: طرق المتابعة الزمنية (المعايرة وإفراط الضغط)',
                  content: 'شرح مفصل لطرق المتابعة السريعة والبطيئة ورسم جدول التقدم.',
                  videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                  order: 1,
                },
                {
                  title: 'الدرس 2: زمن نصف التفاعل t1/2 والسرعة الحجمية',
                  content: 'طريقة تحديد t1/2 بيانيا وحساب السرعة الحجمية للتفاعل والختفاء.',
                  order: 2,
                },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.product.upsert({
    where: { slug: 'free-bac-2026-revision-roadmap' },
    update: {},
    create: {
      creatorId: 'KRYTY',
      creatorName: 'KRYTY Education Team',
      creatorType: 'KRYTY',
      title: 'FREE BAC 2026 Official Revision Roadmap (مخطط المراجعة مجاني)',
      slug: 'free-bac-2026-revision-roadmap',
      description: 'Official 30-day timetable and planning guide for all BAC streams created by senior Algerian educators.',
      coverImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&auto=format&fit=crop&q=80',
      productType: 'BOOK',
      subject: 'Mathematics (الرياضيات)',
      educationLevel: 'BAC Prep (البكالوريا)',
      priceDZD: 0,
      isFree: true,
      previewContent: '100% Free download for all registered KRYTY students.',
      isPublished: true,
      assets: {
        create: [
          {
            title: 'BAC 2026 Revision Roadmap PDF',
            fileUrl: '/assets/free-bac-2026-roadmap.pdf',
            fileType: 'PDF',
            isFreePreview: true,
          },
        ],
      },
    },
  });

  // 8. Platform Settings
  await prisma.platformSetting.upsert({
    where: { key: 'freeProfileReachLimit' },
    update: {},
    create: { key: 'freeProfileReachLimit', value: '100' },
  });

  await prisma.platformSetting.upsert({
    where: { key: 'proPriceDZD' },
    update: {},
    create: { key: 'proPriceDZD', value: '2800' },
  });

  console.log('✅ KRYTY Algerian Educational Seed Data Populated Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
