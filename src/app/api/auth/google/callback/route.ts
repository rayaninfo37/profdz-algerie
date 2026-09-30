import { NextResponse } from 'next/server';
import * as jose from 'jose';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { encryptSecret } from '@/lib/encryption';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'kryty_super_secret_jwt_key_algeria_education_2026_dev_mode_only'
);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');

  if (errorParam) {
    console.error('[GoogleOAuth Callback] Consent denied or error:', errorParam);
    return NextResponse.redirect(new URL('/dashboard/teacher?google_error=consent_denied', url.origin));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/dashboard/teacher?google_error=missing_params', url.origin));
  }

  // 1. Cryptographic state verification
  let targetUserId: string | null = null;
  try {
    const { payload } = await jose.jwtVerify(state, JWT_SECRET);
    if (payload.purpose !== 'google_oauth_connect' || !payload.userId) {
      return NextResponse.redirect(new URL('/dashboard/teacher?google_error=invalid_state', url.origin));
    }
    targetUserId = String(payload.userId);
  } catch (err: any) {
    console.error('[GoogleOAuth Callback] State verification failed:', err?.message);
    return NextResponse.redirect(new URL('/dashboard/teacher?google_error=expired_state', url.origin));
  }

  // 2. Strict Session Authentication & Anti-Cross-Account Binding Protection
  // The user currently signed in must match the user who generated the state
  const currentUser = await getCurrentUser().catch(() => null);
  if (!currentUser || currentUser.id !== targetUserId) {
    console.error('[GoogleOAuth Callback] User session mismatch with OAuth state:', {
      sessionUser: currentUser?.id,
      stateUser: targetUserId,
    });
    return NextResponse.redirect(new URL('/dashboard/teacher?google_error=unauthorized_session', url.origin));
  }

  if (currentUser.role !== 'TEACHER') {
    return NextResponse.redirect(new URL('/dashboard/teacher?google_error=not_teacher', url.origin));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL('/dashboard/teacher?google_error=not_configured', url.origin));
  }

  try {
    const redirectUri = `${url.origin}/api/auth/google/callback`;

    // 3. Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text().catch(() => '');
      console.error('[GoogleOAuth] Token exchange failed:', tokenRes.status, errText);
      return NextResponse.redirect(new URL('/dashboard/teacher?google_error=token_exchange_failed', url.origin));
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in || 3600;
    const expiryDate = new Date(Date.now() + expiresIn * 1000);

    // 4. Get connected Google email
    let googleEmail: string | null = null;
    if (accessToken) {
      try {
        const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: AbortSignal.timeout(10000),
        });
        if (userinfoRes.ok) {
          const uInfo = await userinfoRes.json();
          googleEmail = uInfo.email || null;
        }
      } catch (e) {
        console.warn('[GoogleOAuth] Could not fetch Google userinfo:', e);
      }
    }

    // 5. Encrypt sensitive tokens at rest before writing to DB
    const encryptedRefreshToken = refreshToken ? encryptSecret(refreshToken) : undefined;
    const encryptedAccessToken = accessToken ? encryptSecret(accessToken) : null;

    // 6. Save encrypted tokens securely in TeacherProfile
    await prisma.teacherProfile.update({
      where: { userId: targetUserId },
      data: {
        ...(encryptedRefreshToken ? { googleRefreshToken: encryptedRefreshToken } : {}),
        googleAccessToken: encryptedAccessToken,
        googleTokenExpiry: expiryDate,
        googleEmail: googleEmail || undefined,
      },
    });

    // 7. Audit log (NO tokens in details)
    await prisma.auditLog.create({
      data: {
        actorId: targetUserId,
        action: 'GOOGLE_OAUTH_CONNECTED',
        target: targetUserId,
        category: 'SECURITY',
        details: JSON.stringify({ email: googleEmail }),
      },
    }).catch(() => {});

    return NextResponse.redirect(new URL('/dashboard/teacher?google_connected=true', url.origin));
  } catch (error: any) {
    console.error('[GoogleOAuth Callback] Fatal error:', error);
    return NextResponse.redirect(new URL('/dashboard/teacher?google_error=internal_error', url.origin));
  }
}
