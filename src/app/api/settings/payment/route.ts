import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await prisma.platformSetting.findMany({
      where: {
        key: {
          in: [
            'ccpAccount',
            'ccpKey',
            'baridiMobRip',
            'accountHolderName',
            'proPriceDZD',
          ],
        },
      },
    });

    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({
      success: true,
      paymentSettings: {
        ccpAccount: settingsMap['ccpAccount'] || '',
        ccpKey: settingsMap['ccpKey'] || '',
        baridiMobRip: settingsMap['baridiMobRip'] || '',
        accountHolderName: settingsMap['accountHolderName'] || '',
        proPriceDZD: parseInt(settingsMap['proPriceDZD'] || '900', 10),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'فشل في استرجاع إعدادات الدفع' },
      { status: 500 }
    );
  }
}
