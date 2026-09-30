import { NextResponse } from 'next/server';

/**
 * POST /api/posts/[id]/like
 *
 * Social engagement (likes) has been removed from the KRYTY platform.
 * This endpoint is permanently disabled.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'ميزة الإعجابات غير متاحة في هذه المنصة.' },
    { status: 410 }
  );
}
