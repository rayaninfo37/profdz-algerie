import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@/types';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const settings = await prisma.platformSetting.findMany();
    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({
      success: true,
      settings: {
        trialDurationDays: settingsMap['trialDurationDays'] || '30',
        proPriceDZD: settingsMap['proPriceDZD'] || '900',
        proDurationDays: settingsMap['proDurationDays'] || '30',
        ccpAccount: settingsMap['ccpAccount'] || '',
        ccpKey: settingsMap['ccpKey'] || '',
        baridiMobRip: settingsMap['baridiMobRip'] || '',
        accountHolderName: settingsMap['accountHolderName'] || '',
        aboutPlatformVideoUrl: settingsMap['aboutPlatformVideoUrl'] || '',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to load platform settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const body = await request.json();

    // Check if bulk update or single key-value update
    if (body.settings && typeof body.settings === 'object') {
      const updates = [];
      for (const [k, v] of Object.entries(body.settings)) {
        updates.push(
          prisma.platformSetting.upsert({
            where: { key: k },
            update: { value: String(v) },
            create: { key: k, value: String(v) },
          })
        );
      }
      await prisma.$transaction(updates);

      // Sanitize sensitive settings before writing to audit log
      const sanitizedSettings = { ...body.settings };
      if (sanitizedSettings.ccpAccount) sanitizedSettings.ccpAccount = '***MASKED***';
      if (sanitizedSettings.ccpKey) sanitizedSettings.ccpKey = '***MASKED***';
      if (sanitizedSettings.baridiMobRip) sanitizedSettings.baridiMobRip = '***MASKED***';

      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: 'UPDATE_PLATFORM_SETTINGS_BULK',
          target: 'PlatformSetting',
          details: JSON.stringify(sanitizedSettings),
        },
      });

      const { revalidatePath } = await import('next/cache');
      revalidatePath('/about');
      revalidatePath('/');
      revalidatePath('/admin');

      return NextResponse.json({ success: true, message: 'تم تحديث الإعدادات بنجاح' });
    }

    const { key, value } = body;
    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Setting key and value are required' }, { status: 400 });
    }

    const updatedSetting = await prisma.platformSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });

    const isSensitive = ['ccpAccount', 'ccpKey', 'baridiMobRip'].includes(key);
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'UPDATE_PLATFORM_SETTING',
        target: key,
        details: isSensitive ? `Updated ${key} to ***MASKED***` : `Updated ${key} to ${value}`,
      },
    });

    const { revalidatePath } = await import('next/cache');
    revalidatePath('/about');
    revalidatePath('/');
    revalidatePath('/admin');

    return NextResponse.json({ success: true, setting: updatedSetting });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
  }
}
