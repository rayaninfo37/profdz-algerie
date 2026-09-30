import { NextResponse } from 'next/server';

/**
 * Direct Contact Model: KRYTY connects learners directly with teachers.
 * Live automated payment gateways (CIB/Satim) are not integrated in this version.
 * Communication and book acquisition occurs directly via WhatsApp/Telegram.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({
    success: false,
    message: 'منصة قراتي تعتمد نموذج التواصل المباشر مع الأستاذ (Direct Contact) عبر واتساب أو تيليغرام لطلب الكتب والموارد التعليمية دون وساطة مالية آلية.',
    productId: id,
  }, { status: 400 });
}
