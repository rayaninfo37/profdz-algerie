import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const WILAYAS = [
  { code: '01', name: 'أدرار (Adrar)' },
  { code: '02', name: 'الشلف (Chlef)' },
  { code: '03', name: 'الأغواط (Laghouat)' },
  { code: '04', name: 'أم البواقي (Oum El Bouaghi)' },
  { code: '05', name: 'باتنة (Batna)' },
  { code: '06', name: 'بجاية (Béjaïa)' },
  { code: '07', name: 'بسكرة (Biskra)' },
  { code: '08', name: 'بشار (Béchar)' },
  { code: '09', name: 'البليدة (Blida)' },
  { code: '10', name: 'البويرة (Bouira)' },
  { code: '11', name: 'تمنراست (Tamanrasset)' },
  { code: '12', name: 'تبسة (Tébessa)' },
  { code: '13', name: 'تلمسان (Tlemcen)' },
  { code: '14', name: 'تيارت (Tiaret)' },
  { code: '15', name: 'تيزي وزو (Tizi Ouzou)' },
  { code: '16', name: 'الجزائر (Algiers)' },
  { code: '17', name: 'الجلفة (Djelfa)' },
  { code: '18', name: 'جيجل (Jijel)' },
  { code: '19', name: 'سطيف (Sétif)' },
  { code: '20', name: 'سعيدة (Saïda)' },
  { code: '21', name: 'سكيكدة (Skikda)' },
  { code: '22', name: 'سيدي بلعباس (Sidi Bel Abbès)' },
  { code: '23', name: 'عنابة (Annaba)' },
  { code: '24', name: 'قالمة (Guelma)' },
  { code: '25', name: 'قسنطينة (Constantine)' },
  { code: '26', name: 'المدية (Médéa)' },
  { code: '27', name: 'مستغانم (Mostaganem)' },
  { code: '28', name: 'المسيلة (M\'Sila)' },
  { code: '29', name: 'معسكر (Mascara)' },
  { code: '30', name: 'ورقلة (Ouargla)' },
  { code: '31', name: 'وهران (Oran)' },
  { code: '32', name: 'البيض (El Bayadh)' },
  { code: '33', name: 'إليزي (Illizi)' },
  { code: '34', name: 'برج بوعريريج (Bordj Bou Arréridj)' },
  { code: '35', name: 'بومرداس (Boumerdès)' },
  { code: '36', name: 'الطارف (El Tarf)' },
  { code: '37', name: 'تندوف (Tindouf)' },
  { code: '38', name: 'تسمسيلت (Tissemsilt)' },
  { code: '39', name: 'الوادي (El Oued)' },
  { code: '40', name: 'خنشلة (Khenchela)' },
  { code: '41', name: 'سوق أهراس (Souk Ahras)' },
  { code: '42', name: 'تيبازة (Tipaza)' },
  { code: '43', name: 'ميلة (Mila)' },
  { code: '44', name: 'عين الدفلى (Aïn Defla)' },
  { code: '45', name: 'النعامة (Naâma)' },
  { code: '46', name: 'عين تموشنت (Aïn Témouchent)' },
  { code: '47', name: 'غرداية (Ghardaïa)' },
  { code: '48', name: 'غليزان (Relizane)' },
  { code: '49', name: 'تيميمون (Timimoun)' },
  { code: '50', name: 'برج باجي مختار (Bordj Badji Mokhtar)' },
  { code: '51', name: 'أولاد جلال (Ouled Djellal)' },
  { code: '52', name: 'بني عباس (Béni Abbès)' },
  { code: '53', name: 'عين صالح (In Salah)' },
  { code: '54', name: 'عين قزام (In Guezzam)' },
  { code: '55', name: 'تقرت (Touggourt)' },
  { code: '56', name: 'جانت (Djanet)' },
  { code: '57', name: 'المغير (El M\'Ghair)' },
  { code: '58', name: 'المنيعة (El Meniaa)' },
];

const FIRST_NAMES = [
  'أحمد', 'محمد', 'يوسف', 'حمزة', 'بلال', 'خالد', 'أمين', 'ياسين', 'طارق', 'كريم',
  'فاطمة', 'مريم', 'إيمان', 'سارة', 'نور', 'خديجة', 'ياسمين', 'زينب', 'أميرة', 'حنان',
  'عبد الرحمن', 'وليد', 'إسلام', 'صالح', 'إبراهيم', 'عمر', 'مصطفى', 'سفيان', 'جمال', 'مراد'
];

const LAST_NAMES = [
  'بن علي', 'براهيمي', 'بلقاسم', 'منصوري', 'زروقي', 'بوجمعة', 'قادري', 'حيدر', 'سليماني', 'علوي',
  'عثماني', 'طاهري', 'بودية', 'مسعودي', 'شاوش', 'دحماني', 'مداح', 'بوعلام', 'كحلوش', 'طالبي'
];

const SUBJECTS_LIST = [
  ['الرياضيات (Mathematics)'],
  ['العلوم الفيزيائية (Physics & Chemistry)'],
  ['علوم الطبيعة والحياة (Natural Sciences)'],
  ['اللغة العربية وآدابها (Arabic Literature)'],
  ['اللغة الفرنسية (French)'],
  ['اللغة الإنجليزية (English)'],
  ['الفلسفة (Philosophy)'],
  ['التاريخ والجغرافيا (History & Geography)'],
  ['العلوم الإسلامية (Islamic Education)'],
  ['البرمجة والإعلام الآلي (Computer Science & AI)']
];

const TITLES = ['PROFESSOR', 'DOCTOR', 'ENGINEER', 'INSPECTOR'];
const MODES = ['IN_PERSON', 'ONLINE', 'BOTH'];

function getAlgPhone(index) {
  const prefix = ['05', '06', '07'][index % 3];
  const num = String(10000000 + (index * 137) % 89999999).padStart(8, '0');
  return `${prefix}${num.slice(0, 8)}`;
}

async function main() {
  console.log('=== STARTING SYNTHETIC TEST DATA SEED (300 USERS) ===');

  const baselineCount = await prisma.user.count();
  console.log(`Baseline user count before seed: ${baselineCount}`);

  const defaultPasswordHash = await bcrypt.hash('TestPass123!', 8);

  // 1. Seed 100 Teachers
  console.log('Seeding 100 synthetic teachers...');
  for (let i = 1; i <= 100; i++) {
    const fn = FIRST_NAMES[i % FIRST_NAMES.length];
    const ln = LAST_NAMES[i % LAST_NAMES.length];
    const fullName = `أ. ${fn} ${ln}`;
    const email = `teacher${String(i).padStart(3, '0')}@synthetic-test.kryty.dz`;
    const wilayaObj = WILAYAS[(i - 1) % WILAYAS.length];
    const phone = getAlgPhone(i);

    // States: 60 FREE_ACTIVE, 25 PRO_ACTIVE, 10 FROZEN, 5 PRO_EXPIRED
    let subState = 'FREE_ACTIVE';
    if (i <= 25) subState = 'PRO_ACTIVE';
    else if (i <= 85) subState = 'FREE_ACTIVE';
    else if (i <= 95) subState = 'FROZEN';
    else subState = 'PRO_EXPIRED';

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: defaultPasswordHash,
        fullName,
        role: 'TEACHER',
        wilaya: wilayaObj.name,
        wilayaCode: wilayaObj.code,
        commune: 'وسط المدينة',
        isTestData: true,
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0e7490&color=fff`,
        teacherProfile: {
          create: {
            professionalTitle: TITLES[i % TITLES.length],
            headline: `أستاذ متخصص في ${SUBJECTS_LIST[i % SUBJECTS_LIST.length][0]} - ولاية ${wilayaObj.name}`,
            bio: `أستاذ ذو كفاءة وخبرة تعليمية بالطور الثانوي والمتوسط، تقديم شروحات وتمارين ونماذج البكالوريا.`,
            subjects: JSON.stringify(SUBJECTS_LIST[i % SUBJECTS_LIST.length]),
            educationLevels: JSON.stringify(['3AS بكالوريا', 'الطور الثانوي']),
            teachingMode: MODES[i % MODES.length],
            experienceYears: (i % 20) + 1,
            pricingInfo: `${1500 + (i % 10) * 200} دج / حصة`,
            phone,
            whatsapp: phone,
            telegram: `@teacher_${i}_kryty`,
            isVerified: i % 4 === 0, // 25% verified
            subscriptionState: subState,
          },
        },
      },
    });
  }

  // 2. Seed 100 Students
  console.log('Seeding 100 synthetic students...');
  for (let i = 1; i <= 100; i++) {
    const fn = FIRST_NAMES[(i + 5) % FIRST_NAMES.length];
    const ln = LAST_NAMES[(i + 7) % LAST_NAMES.length];
    const fullName = `طالب. ${fn} ${ln}`;
    const email = `student${String(i).padStart(3, '0')}@synthetic-test.kryty.dz`;
    const wilayaObj = WILAYAS[(i + 10) % WILAYAS.length];

    await prisma.user.create({
      data: {
        email,
        passwordHash: defaultPasswordHash,
        fullName,
        role: 'STUDENT',
        wilaya: wilayaObj.name,
        wilayaCode: wilayaObj.code,
        commune: 'البلدية المركزية',
        isTestData: true,
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=1e3a5f&color=fff`,
        studentProfile: {
          create: {
            studentType: 'PUPIL_SECONDARY',
            educationLevel: '3AS بكالوريا - شعبة علوم تجريبية',
            interests: JSON.stringify(['الرياضيات', 'العلوم الطبيعية']),
          },
        },
      },
    });
  }

  // 3. Seed 100 Parents
  console.log('Seeding 100 synthetic parents...');
  for (let i = 1; i <= 100; i++) {
    const fn = FIRST_NAMES[(i + 12) % FIRST_NAMES.length];
    const ln = LAST_NAMES[(i + 15) % LAST_NAMES.length];
    const fullName = `ولي أمر. ${fn} ${ln}`;
    const email = `parent${String(i).padStart(3, '0')}@synthetic-test.kryty.dz`;
    const wilayaObj = WILAYAS[(i + 20) % WILAYAS.length];

    await prisma.user.create({
      data: {
        email,
        passwordHash: defaultPasswordHash,
        fullName,
        role: 'PARENT',
        wilaya: wilayaObj.name,
        wilayaCode: wilayaObj.code,
        isTestData: true,
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=7c2d12&color=fff`,
        parentProfile: {
          create: {
            budgetRange: '20,000 - 40,000 دج شهرياً',
          },
        },
      },
    });
  }

  const afterCount = await prisma.user.count();
  const syntheticCount = await prisma.user.count({ where: { isTestData: true } });
  console.log(`Seed completed!`);
  console.log(`Total users in DB: ${afterCount} (Synthetic: ${syntheticCount}, Baseline: ${afterCount - syntheticCount})`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
