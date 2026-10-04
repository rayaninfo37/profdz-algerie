import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole, PostType, SubscriptionState } from '@/types';
import { KRYTY_CONFIG } from '@/lib/config';
import { getAlgiersStartOfDay } from '@/lib/algiersTime';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const level = searchParams.get('level');
    const authorId = searchParams.get('authorId');
    const feedChannel = searchParams.get('channel') || searchParams.get('feed');
    const postTypeParam = searchParams.get('postType') || searchParams.get('type');
    const cursor = searchParams.get('cursor');
    const takeParam = searchParams.get('take');
    const take = takeParam ? Math.min(parseInt(takeParam, 10), 50) : 20;

    const currentUser = await getCurrentUser().catch(() => null);

    const where: any = {};
    if (subject) where.subject = subject;
    if (level) where.educationLevel = level;
    if (authorId) where.authorId = authorId;
    if (postTypeParam && postTypeParam !== 'ALL') {
      where.postType = postTypeParam;
    }

    // Strict role separation between Teacher Feed and Community Feed
    if (feedChannel === 'COMMUNITY') {
      where.author = { role: { in: ['STUDENT', 'PARENT'] } };
    } else if (feedChannel === 'TEACHERS') {
      where.author = { role: 'TEACHER' };
    }

    // For author-filtered feeds: simple cursor pagination without global ranking
    if (authorId) {
      const posts = await prisma.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              role: true,
              activeRole: true,
              teacherProfile: { select: { id: true, headline: true, isVerified: true, subjects: true } },
              studentProfile: { select: { id: true, studentType: true, educationLevel: true } },
            },
          },
          likes: true,
          comments: {
            include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        take,
        ...(cursor
          ? { cursor: { id: Buffer.from(cursor, 'base64').toString('utf-8') }, skip: 1 }
          : {}),
      });

      let nextCursor: string | null = null;
      if (posts.length === take) {
        nextCursor = Buffer.from(posts[posts.length - 1].id, 'utf-8').toString('base64');
      }

      return NextResponse.json({ success: true, posts, nextCursor });
    }

    // For general feeds: fetch a wider window (up to 150), apply global ranking, then paginate
    // Cursor maps to ranked-index offset for stability
    const cursorOffset = cursor ? parseInt(Buffer.from(cursor, 'base64').toString('utf-8'), 10) : 0;
    const fetchWindow = Math.min(cursorOffset + take * 5, 150); // fetch up to 150 for ranking

    const rawPosts = await prisma.post.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            role: true,
            activeRole: true,
            teacherProfile: { select: { id: true, headline: true, isVerified: true, subjects: true } },
            studentProfile: { select: { id: true, studentType: true, educationLevel: true } },
          },
        },
        likes: true,
        comments: {
          include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: fetchWindow,
    });

    // Apply global ranking over the entire fetched window
    const { calculatePostScore } = await import('@/lib/feedRanker');
    const ranked = rawPosts
      .map((post) => ({
        ...post,
        rankScore: (post as any).isPinned
          ? 999999
          : calculatePostScore(post.likes.length, post.comments.length, post.createdAt),
      }))
      .sort((a, b) => b.rankScore - a.rankScore);

    // Slice the requested page from the globally-ranked results
    const page = ranked.slice(cursorOffset, cursorOffset + take);

    const nextOffset = cursorOffset + take;
    const nextCursor = nextOffset < ranked.length
      ? Buffer.from(String(nextOffset), 'utf-8').toString('base64')
      : null;

    return NextResponse.json({ success: true, posts: page, nextCursor });
  } catch (error: any) {
    console.error('Fetch posts error:', error);
    return NextResponse.json({ error: 'فشل في جلب المنشورات التعليمية' }, { status: 500 });
  }
}


export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول لنشر محتوى' }, { status: 401 });
    }

    if (user.isFrozen) {
      return NextResponse.json({ error: 'حسابك مجمّد. تواصل مع الإدارة.' }, { status: 403 });
    }
    if (user.softDeletedAt) {
      return NextResponse.json({ error: 'هذا الحساب تم حذفه.' }, { status: 403 });
    }

    // Determine current effective role (respecting activeRole if persona switched)
    const effectiveRole = user.activeRole || user.role;

    // Allow TEACHER, STUDENT, PARENT, ADMIN to post
    if (
      effectiveRole !== UserRole.TEACHER &&
      effectiveRole !== UserRole.STUDENT &&
      effectiveRole !== UserRole.PARENT &&
      user.role !== UserRole.ADMIN
    ) {
      return NextResponse.json(
        { error: 'عذراً، النشر في الخلاصة التعليمية مخصص للأساتذة والتلاميذ والطلبة وأولياء الأمور المسجلين.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, postType, subject, educationLevel, mediaUrl } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'محتوى المنشور إلزامي' }, { status: 400 });
    }

    // 1. Strict 500 characters limit
    if (content.trim().length > KRYTY_CONFIG.uploadLimits.maxFeedPostCharacters) {
      return NextResponse.json({
        error: `محتوى المنشور لا يمكن أن يتجاوز ${KRYTY_CONFIG.uploadLimits.maxFeedPostCharacters} حرفاً. طول النص الحالي: ${content.trim().length} حرفاً.`,
      }, { status: 400 });
    }

    // Media detection
    const isVideo = mediaUrl && /\.(mp4|webm)(\?.*)?$/i.test(mediaUrl);

    // Compute start of day in Africa/Algiers timezone
    const todayStart = getAlgiersStartOfDay();
    // Rolling 24 hours timestamp for strict Student / Parent limit
    const rolling24hAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // ==========================================
    // A. TEACHER POSTING RULES & QUOTAS
    // ==========================================
    if (effectiveRole === UserRole.TEACHER) {
      const teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId: user.id },
      });

      if (!teacherProfile && user.role !== UserRole.ADMIN) {
        return NextResponse.json({ error: 'الملف الشخصي للأستاذ غير مكتمل' }, { status: 400 });
      }

      const isPro = teacherProfile?.subscriptionState === SubscriptionState.PRO_ACTIVE || user.role === UserRole.ADMIN;
      const isFrozen = teacherProfile?.subscriptionState === SubscriptionState.FROZEN;
      const isExpired = teacherProfile?.subscriptionState === SubscriptionState.PRO_EXPIRED;

      if (isFrozen) {
        return NextResponse.json({
          error: 'حسابك في حالة تجميد مؤقت لانتهاء الفترة التجريبية المجانية (30 يوماً). يرجى الترقية إلى PRO لاستئناف النشر.',
        }, { status: 403 });
      }

      if (isExpired && user.role !== UserRole.ADMIN) {
        return NextResponse.json({
          error: 'انتهت فترة اشتراكك في باقة PRO. يرجى تجديد الاشتراك لاستئناف نشر المنشورات التعليمية.',
        }, { status: 403 });
      }

      // Count teacher posts published today
      const todayPostsCount = await prisma.post.count({
        where: {
          authorId: user.id,
          createdAt: { gte: todayStart },
        },
      });

      const maxDailyPosts = isPro ? KRYTY_CONFIG.quotas.proTeacherPostsPerDay : KRYTY_CONFIG.quotas.freeTeacherPostsPerDay;
      if (todayPostsCount >= maxDailyPosts) {
        return NextResponse.json({
          error: isPro
            ? `لقد بلغت الحد الأقصى للمنشورات اليومية (${maxDailyPosts} منشورات يومياً لباقة PRO). يتجدد الرصيد عند منتصف الليل بتوقيت الجزائر.`
            : `لقد استنفدت منشورك اليومي المجاني (منشور واحد يومياً للحساب المجاني). للترقية إلى 3 منشورات يومياً، انضم لباقة PRO.`,
        }, { status: 400 });
      }

      if (isVideo) {
        return NextResponse.json({
          error: 'منصة قراتي مخصصة للصور والمستندات التعليمية فقط. نشر مقاطع الفيديو غير مدعوم في هذا الإصدار.',
        }, { status: 400 });
      }
    }

    // ==========================================
    // B. STUDENT & PARENT COMMUNITY POSTING RULES (Workstream 11)
    // ==========================================
    if (effectiveRole === UserRole.STUDENT || effectiveRole === UserRole.PARENT) {
      // Workstream 11: Exactly 1 post per Algerian calendar day
      const todayPostsCount = await prisma.post.count({
        where: {
          authorId: user.id,
          createdAt: { gte: todayStart },
        },
      });

      if (todayPostsCount >= 1 && user.role !== UserRole.ADMIN) {
        return NextResponse.json({
          error: 'يمكنك نشر منشور واحد فقط في مجتمع قراتي كل يوم. عد غدًا لإضافة منشور جديد.',
        }, { status: 400 });
      }

      // No video uploads allowed for Community Feed
      if (isVideo) {
        return NextResponse.json({
          error: 'منصة قراتي مخصصة للصور والمستندات التعليمية فقط. نشر مقاطع الفيديو غير مدعوم.',
        }, { status: 400 });
      }
    }

    // Resolve post type with sensible fallback
    const resolvedType = (postType as PostType) || (
      effectiveRole === UserRole.STUDENT ? PostType.STUDENT_QUESTION : PostType.TIP
    );

    // Create Post
    const post = await prisma.post.create({
      data: {
        authorId: user.id,
        title: title ? title.trim() : null,
        content: content.trim(),
        postType: resolvedType,
        subject: subject || null,
        educationLevel: educationLevel || null,
        mediaUrl: mediaUrl || null,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            role: true,
            activeRole: true,
            teacherProfile: true,
            studentProfile: true,
          },
        },
      },
    });

    // Revalidate affected pages immediately
    revalidatePath('/feed');
    revalidatePath('/dashboard/teacher');
    if (user.teacherProfile?.id) {
      revalidatePath(`/teachers/${user.teacherProfile.id}`);
    }

    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    console.error('Create post error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء نشر المنشور. يرجى المحاولة لاحقاً.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('id');

    if (!postId) {
      return NextResponse.json({ error: 'معرّف المنشور مطلوب' }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: 'المنشور غير موجود' }, { status: 404 });
    }

    if (post.authorId !== user.id && user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'غير مصرح لك بحذف هذا المنشور' }, { status: 403 });
    }

    await prisma.post.delete({
      where: { id: postId },
    });

    revalidatePath('/feed');
    revalidatePath('/dashboard/teacher');
    if (user.teacherProfile?.id) {
      revalidatePath(`/teachers/${user.teacherProfile.id}`);
    }

    return NextResponse.json({ success: true, message: 'تم حذف المنشور بنجاح' });
  } catch (error: any) {
    console.error('Delete post error:', error);
    return NextResponse.json({ error: 'فشل في حذف المنشور' }, { status: 500 });
  }
}
