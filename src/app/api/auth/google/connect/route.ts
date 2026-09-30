import { NextResponse } from 'next/server';
import * as jose from 'jose';
import { getCurrentUser } from '@/lib/auth';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kryty_super_secret_jwt_key_algeria_education_2026_dev_mode_only'
);

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول أولاً' }, { status: 401 });
    }

    if (user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'صلاحية ربط Google Sheets مخصصة للأساتذة فقط' }, { status: 403 });
    }

    if (user.isFrozen || user.softDeletedAt) {
      return NextResponse.json({ error: 'حسابك معطل حالياً. تواصل مع الإدارة.' }, { status: 403 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({
        error: 'خدمة Google OAuth غير مهيأة على الخادم (GOOGLE_CLIENT_ID غير موجود). يرجى مراجعة إدارة المنصة.',
      }, { status: 503 });
    }

    const url = new URL(request.url);
    const redirectUri = `${url.origin}/api/auth/google/callback`;

    // Secure, cryptographically signed & time-bounded state token
    const stateToken = await new jose.SignJWT({
      userId: user.id,
      purpose: 'google_oauth_connect',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(JWT_SECRET);

    const scopes = [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' ');

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${encodeURIComponent(stateToken)}`;

    return NextResponse.json({ success: true, url: authUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'خطأ في معالجة طلب ربط Google' }, { status: 500 });
  }
}
