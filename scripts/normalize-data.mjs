import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const WILAYA_MAP = {
  'adrar': '01', 'أدرار': '01',
  'chlef': '02', 'الشلف': '02',
  'laghouat': '03', 'الأغواط': '03',
  'oum el bouaghi': '04', 'أم البواقي': '04',
  'batna': '05', 'باتنة': '05',
  'béjaïa': '06', 'bejaia': '06', 'بجاية': '06',
  'biskra': '07', 'بسكرة': '07',
  'béchar': '08', 'bechar': '08', 'بشار': '08',
  'blida': '09', 'البليدة': '09',
  'bouira': '10', 'البويرة': '10',
  'tamanrasset': '11', 'تمنراست': '11',
  'tébessa': '12', 'tebessa': '12', 'تبسة': '12',
  'tlemcen': '13', 'تلمسان': '13',
  'tiaret': '14', 'تيارت': '14',
  'tizi ouzou': '15', 'تيزي وزو': '15',
  'algiers': '16', 'alger': '16', 'الجزائر': '16', 'الجزائر العاصمة': '16',
  'djelfa': '17', 'الجلفة': '17',
  'jijel': '18', 'جيجل': '18',
  'sétif': '19', 'setif': '19', 'سطيف': '19',
  'saïda': '20', 'saida': '20', 'سعيدة': '20',
  'skikda': '21', 'سكيكدة': '21',
  'sidi bel abbès': '22', 'sidi bel abbes': '22', 'سيدي بلعباس': '22',
  'annaba': '23', 'عنابة': '23',
  'guelma': '24', 'قالمة': '24',
  'constantine': '25', 'قسنطينة': '25',
  'médéa': '26', 'medea': '26', 'المدية': '26',
  'mostaganem': '27', 'مستغانم': '27',
  'm\'sila': '28', 'msila': '28', 'المسيلة': '28',
  'mascara': '29', 'معسكر': '29',
  'ouargla': '30', 'ورقلة': '30',
  'oran': '31', 'وهران': '31',
  'el bayadh': '32', 'البيض': '32',
  'illizi': '33', 'إليزي': '33',
  'bordj bou arréridj': '34', 'bordj bou arreridj': '34', 'برج بوعريريج': '34',
  'boumerdès': '35', 'boumerdes': '35', 'بومرداس': '35',
  'el tarf': '36', 'الطارف': '36',
  'tindouf': '37', 'تندوف': '37',
  'tissemsilt': '38', 'تسمسيلت': '38',
  'el oued': '39', 'الوادي': '39',
  'khenchela': '40', 'خنشلة': '40',
  'souk ahras': '41', 'سوق أهراس': '41',
  'tipaza': '42', 'تيبازة': '42',
  'mila': '43', 'ميلة': '43',
  'aïn defla': '44', 'ain defla': '44', 'عين الدفلى': '44',
  'naâma': '45', 'naama': '45', 'النعامة': '45',
  'aïn témouchent': '46', 'ain temouchent': '46', 'عين تموشنت': '46',
  'ghardaïa': '47', 'ghardaia': '47', 'غرداية': '47',
  'relizane': '48', 'غليزان': '48',
  'timimoun': '49', 'تيميمون': '49',
  'bordj badji mokhtar': '50', 'برج باجي مختار': '50',
  'ouled djellal': '51', 'أولاد جلال': '51',
  'béni abbès': '52', 'beni abbes': '52', 'بني عباس': '52',
  'in salah': '53', 'عين صالح': '53',
  'in guezzam': '54', 'عين قزام': '54',
  'touggourt': '55', 'تقرت': '55',
  'djanet': '56', 'جانت': '56',
  'el m\'ghair': '57', 'el mghair': '57', 'المغير': '57',
  'el menia': '58', 'المنيعة': '58'
};

function resolveWilayaCode(wilayaStr) {
  if (!wilayaStr) return null;
  const lower = wilayaStr.toLowerCase();
  for (const [key, code] of Object.entries(WILAYA_MAP)) {
    if (lower.includes(key)) {
      return code;
    }
  }
  return null;
}

async function main() {
  console.log('=== STARTING DATA NORMALIZATION ===');

  const freeTeachersCount = await prisma.teacherProfile.count({ where: { subscriptionState: 'FREE' } });
  const hybridTeachersCount = await prisma.teacherProfile.count({ where: { teachingMode: 'HYBRID' } });
  const totalTeachers = await prisma.teacherProfile.count();
  const totalUsers = await prisma.user.count();

  console.log(`Before: FREE subscriptionState count = ${freeTeachersCount}`);
  console.log(`Before: HYBRID teachingMode count = ${hybridTeachersCount}`);
  console.log(`Total Teachers = ${totalTeachers}, Total Users = ${totalUsers}`);

  if (freeTeachersCount > 0) {
    const updatedSub = await prisma.teacherProfile.updateMany({
      where: { subscriptionState: 'FREE' },
      data: { subscriptionState: 'FREE_ACTIVE' }
    });
    console.log(`Updated ${updatedSub.count} teachers from FREE to FREE_ACTIVE.`);
  }

  if (hybridTeachersCount > 0) {
    const updatedMode = await prisma.teacherProfile.updateMany({
      where: { teachingMode: 'HYBRID' },
      data: { teachingMode: 'BOTH' }
    });
    console.log(`Updated ${updatedMode.count} teachers from HYBRID to BOTH.`);
  }

  const usersWithWilaya = await prisma.user.findMany({
    where: { wilaya: { not: null } },
    select: { id: true, wilaya: true, wilayaCode: true }
  });

  let wilayaUpdated = 0;
  for (const u of usersWithWilaya) {
    const code = resolveWilayaCode(u.wilaya);
    if (code && u.wilayaCode !== code) {
      await prisma.user.update({
        where: { id: u.id },
        data: { wilayaCode: code }
      });
      wilayaUpdated++;
    }
  }
  console.log(`Populated/normalized wilayaCode for ${wilayaUpdated} users.`);

  const defaultSettings = [
    { key: 'freeProfileReachLimit', value: '100' },
    { key: 'proPriceDZD', value: '2800' },
    { key: 'ccpAccount', value: '' },
    { key: 'ccpKey', value: '' },
    { key: 'baridiMobRip', value: '' },
    { key: 'accountHolderName', value: '' }
  ];

  for (const s of defaultSettings) {
    const existing = await prisma.platformSetting.findUnique({ where: { key: s.key } });
    if (!existing) {
      await prisma.platformSetting.create({ data: s });
      console.log(`Created default setting: ${s.key}`);
    }
  }

  const afterFree = await prisma.teacherProfile.count({ where: { subscriptionState: 'FREE' } });
  const afterHybrid = await prisma.teacherProfile.count({ where: { teachingMode: 'HYBRID' } });
  console.log(`After verification: FREE count = ${afterFree}, HYBRID count = ${afterHybrid}`);

  if (afterFree === 0 && afterHybrid === 0) {
    console.log('SUCCESS: DATA NORMALIZATION COMPLETE');
  } else {
    throw new Error('Normalization verification failed.');
  }
}

main()
  .catch((err) => {
    console.error('Normalization error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
