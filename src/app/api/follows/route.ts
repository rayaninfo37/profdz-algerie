import { NextResponse } from 'next/server';

/**
 * Follows API
 * 
 * Following functionality has been disabled in the simplified KRYTY release.
 * Teachers are discovered and contacted directly without social followers.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'ميزة المتابعة غير متاحة في هذه المنصة.' },
    { status: 410 }
  );
}

export async function GET() {
  return NextResponse.json({
    success: true,
    followers: [],
    following: [],
    pagination: { total: 0, take: 0, skip: 0, hasMore: false },
  });
}
