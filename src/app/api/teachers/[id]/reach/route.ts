import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { recordProfileView, getTeacherReachStatus } from '@/lib/reach';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: teacherId } = await params;
    const currentUser = await getCurrentUser();

    if (currentUser) {
      await recordProfileView(teacherId, currentUser.id);
    }

    const reachStatus = await getTeacherReachStatus(teacherId);
    return NextResponse.json({ success: true, reachStatus });
  } catch (error: any) {
    console.error('Reach tracking error:', error);
    return NextResponse.json({ error: 'Failed to record reach event' }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: teacherId } = await params;
    const reachStatus = await getTeacherReachStatus(teacherId);
    return NextResponse.json({ success: true, reachStatus });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch reach status' }, { status: 500 });
  }
}
