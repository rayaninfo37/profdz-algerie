import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/middleware/rateLimitMiddleware';

/**
 * Comments API
 * 
 * Supports questions and educational discussions on:
 * 1. Teacher announcements / posts (postId)
 * 2. Digital educational products / resources (productId)
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const productId = searchParams.get('productId');

    if (!postId && !productId) {
      return NextResponse.json(
        { error: 'يجب تحديد معرف المنشور أو المنتج (postId or productId).' },
        { status: 400 }
      );
    }

    const comments = await prisma.comment.findMany({
      where: postId ? { postId } : { productId: productId! },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ success: true, comments });
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    return NextResponse.json(
      { error: 'فشل في تحميل التعليقات.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const limitRes = await rateLimit(request);
  if (limitRes) return limitRes;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول لإضافة تعليق أو استفسار.' },
        { status: 401 }
      );
    }

    if (user.isFrozen) {
      return NextResponse.json({ error: 'حسابك مجمّد. تواصل مع الإدارة.' }, { status: 403 });
    }
    if (user.softDeletedAt) {
      return NextResponse.json({ error: 'هذا الحساب تم حذفه.' }, { status: 403 });
    }

    const body = await request.json();
    const { postId, productId, content } = body;

    if (!postId && !productId) {
      return NextResponse.json(
        { error: 'يجب تحديد المنشور أو المنتج المستهدف.' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json(
        { error: 'محتوى التعليق لا يمكن أن يكون فارغاً.' },
        { status: 400 }
      );
    }

    const cleanContent = content.trim();
    if (cleanContent.length > 500) {
      return NextResponse.json(
        { error: 'التعليق يجب ألا يتجاوز 500 حرف.' },
        { status: 400 }
      );
    }

    // Verify existence of target
    if (postId) {
      const post = await prisma.post.findUnique({ where: { id: postId } });
      if (!post) {
        return NextResponse.json({ error: 'المنشور غير موجود.' }, { status: 404 });
      }
    } else if (productId) {
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) {
        return NextResponse.json({ error: 'المنتج غير موجود.' }, { status: 404 });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        userId: user.id,
        content: cleanContent,
        postId: postId || null,
        productId: productId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });

    try {
      const { revalidatePath } = await import('next/cache');
      if (postId) {
        revalidatePath('/feed');
        revalidatePath('/dashboard/teacher');
      }
      if (productId) {
        revalidatePath('/products');
      }
    } catch {}

    return NextResponse.json({ success: true, comment }, { status: 201 });
  } catch (error) {
    console.error('Failed to create comment:', error);
    return NextResponse.json(
      { error: 'فشل في حفظ التعليق. يرجى المحاولة لاحقاً.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول لحذف التعليق.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');

    if (!commentId) {
      return NextResponse.json(
        { error: 'معرف التعليق مطلوب (Comment ID required).' },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json({ error: 'التعليق غير موجود.' }, { status: 404 });
    }

    // IDOR check: author or ADMIN
    if (comment.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'غير مصرح لك بحذف هذا التعليق.' },
        { status: 403 }
      );
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    try {
      const { revalidatePath } = await import('next/cache');
      if (comment.postId) {
        revalidatePath('/feed');
        revalidatePath('/dashboard/teacher');
      }
      if (comment.productId) {
        revalidatePath('/products');
      }
    } catch {}

    return NextResponse.json({ success: true, message: 'تم حذف التعليق بنجاح.' });
  } catch (error) {
    console.error('Failed to delete comment:', error);
    return NextResponse.json(
      { error: 'فشل في حذف التعليق.' },
      { status: 500 }
    );
  }
}
