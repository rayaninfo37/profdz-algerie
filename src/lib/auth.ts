import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from './db';
import { UserRole } from '@/types';

const rawJwtSecret = process.env.JWT_SECRET;
if (!rawJwtSecret && process.env.NODE_ENV === 'production') {
  throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable is not defined in production.');
}
const JWT_SECRET = new TextEncoder().encode(
  rawJwtSecret || 'kryty_dev_local_secret_key_only_not_for_prod'
);

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  fullName: string;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('kryty_session')?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      teacherProfile: true,
      studentProfile: true,
      parentProfile: true,
      institutionProfile: true,
    },
  });

  if (!user) return null;

  // Frozen or soft-deleted accounts are treated as unauthenticated for all protected operations.
  // The session cookie is left in place so the user gets a meaningful error on their next
  // explicit request rather than a confusing redirect loop.
  if (user.isFrozen || user.softDeletedAt) {
    // Return the user object but annotate it so callers can decide how to respond
    // (login route shows specific error; other routes see it as blocked)
    return { ...user, _blocked: true } as typeof user & { _blocked?: boolean };
  }

  return user;
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('kryty_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set('kryty_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/**
 * Strips password hash and Google OAuth tokens from user objects before returning to clients
 */
export function sanitizeUserForClient(user: any) {
  if (!user) return null;
  const { passwordHash, ...safeUser } = user;

  if (safeUser.teacherProfile) {
    const {
      googleAccessToken,
      googleRefreshToken,
      googleTokenExpiry,
      ...safeTeacherProfile
    } = safeUser.teacherProfile;

    safeUser.teacherProfile = {
      ...safeTeacherProfile,
      isGoogleConnected: !!googleRefreshToken,
    };
  }

  return safeUser;
}
