import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { hasUserEntitlement } from '@/lib/entitlement';
import { BookOpen, Sparkles, ShoppingBag, CheckCircle, Video, FileText, ArrowRight, MapPin, Image, Play, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProductCard } from '@/components/discovery/ProductCard';
import { CommentsSection } from '@/components/common/CommentsSection';
import { ProductReviewSection } from '@/components/discovery/ProductReviewSection';
import { enrichProduct, isPublicProduct } from '@/lib/products';
import { ProductPageClient } from '@/components/products/ProductPageClient';

export const revalidate = 0;

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, currentUser] = await Promise.all([
    params,
    getCurrentUser(),
  ]);
  const decodedSlug = decodeURIComponent(slug);
  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { slug },
        { slug: decodedSlug },
      ],
    },
    include: {
      assets: true,
      comments: {
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
      },
      modules: {
        include: {
          lessons: true,
        },
      },
      reviews: {
        where: { status: 'PUBLISHED' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              wilaya: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!product) {
    notFound();
  }

  const [enrichedProduct, isEntitled] = await Promise.all([
    enrichProduct(product),
    currentUser ? hasUserEntitlement(currentUser.id, product.id) : Promise.resolve(false),
  ]);

  const isAdmin = currentUser?.role === 'ADMIN';
  const isOwner = currentUser?.teacherProfile?.id === product.creatorId;

  // Dynamic eligibility: if creator removes both WhatsApp and Telegram, 404 unless Admin or Owner
  if (!isPublicProduct(enrichedProduct) && !isAdmin && !isOwner) {
    notFound();
  }

  // Live teacher status and name derived directly from enrichedProduct (zero redundant DB queries)
  const teacherActive = product.creatorType === 'TEACHER'
    ? !enrichedProduct.teacherIsFrozen && !enrichedProduct.teacherSoftDeleted
    : true;
  const liveCreatorName = enrichedProduct.creatorName || product.creatorName;

  // Track product view (with IP hash for guests, userId for registered users)
  const { headers } = await import('next/headers');
  const crypto = await import('crypto');
  let ipHash: string | undefined = undefined;
  if (!currentUser) {
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '127.0.0.1';
    const clientIp = forwardedFor.split(',')[0].trim();
    ipHash = crypto.createHash('sha256').update(clientIp).digest('hex');
  }
  const { recordProductVisitor } = await import('@/lib/visitorTracking');
  await recordProductVisitor(product.id, currentUser?.id, ipHash);

  // Strip contact data for unauthenticated users (Requirement 18)
  const safeProduct = !currentUser
    ? { ...enrichedProduct, whatsapp: null, telegram: null, phone: null }
    : enrichedProduct;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-slate-100" dir="rtl">
      {/* Product Hero Section */}
      <div className="clean-card p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-center bg-[#0A1628]/90 border border-cyan-500/25 shadow-2xl backdrop-blur-xl rounded-3xl">
        {/* Cover */}
        <div className="relative h-64 w-full bg-slate-950 rounded-2xl overflow-hidden border border-white/10 shadow-inner">
          <img
            src={product.coverImage || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&auto=format&fit=crop&q=80'}
            alt={product.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3">
            <Badge variant={product.isFree ? 'teal' : 'burgundy'} size="md" className="font-bold">
              {product.isFree ? 'FREE (مجاني)' : `${product.priceDZD.toLocaleString()} DZD`}
            </Badge>
          </div>
        </div>

        {/* Info */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Badge variant="teal" className="bg-cyan-950/60 border-cyan-500/40 text-cyan-300">{product.subject}</Badge>
            <Badge variant="slate" className="bg-slate-800 border-white/10 text-slate-300">{product.educationLevel}</Badge>
            <Badge variant="amber">{product.productType}</Badge>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">{product.title}</h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">{product.description}</p>

          <div className="text-xs text-cyan-300 font-semibold">
            المؤلف / الناشر: <strong className="text-white">{liveCreatorName}</strong> ({product.creatorType})
          </div>

          {safeProduct.storeLocation && (
            <div className="flex items-center gap-2 text-xs text-cyan-200 font-medium p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl">
              <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>مقر وموقع الاستلام / التدريس: <strong className="text-white">{safeProduct.storeLocation}</strong></span>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex items-center gap-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <ProductCard product={safeProduct as any} hasEntitlement={isEntitled} isDetailView={true} />
            </div>
          </div>
        </div>
      </div>

      {/* YouTube Player + Purchase CTA (client interactive) */}
      <ProductPageClient
        product={{
          id: product.id,
          title: product.title,
          priceDZD: product.priceDZD,
          isFree: product.isFree,
          youtubeUrl: (product as any).youtubeUrl || null,
          purchaseFormSchema: (product as any).purchaseFormSchema || null,
        }}
        teacherActive={teacherActive}
      />

      {/* Internal Gallery Images */}

      {product.assets && product.assets.filter(a => a.assetPurpose === 'GALLERY').length > 0 && (
        <div className="clean-card p-6 space-y-4 bg-[#0A1628]/90 border border-cyan-500/25 shadow-2xl backdrop-blur-xl rounded-3xl">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Image className="w-5 h-5 text-cyan-400" /> صور المعاينة والتصفح ({product.assets.filter(a => a.assetPurpose === 'GALLERY').length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {product.assets.filter(a => a.assetPurpose === 'GALLERY').map((img) => (
              <div key={img.id} className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-slate-950 group">
                <img
                  src={img.fileUrl}
                  alt={img.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Free Sample Preview Section - Only if real preview exists or product is free */}
      {(product.isFree || (product.previewContent && product.previewContent.trim().length > 0) || (product.assets && product.assets.some(a => a.isFreePreview))) && (
        <div className="clean-card p-6 space-y-4 bg-[#0A1628]/90 border border-cyan-500/25 shadow-2xl backdrop-blur-xl rounded-3xl">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" /> عينة المعاينة المجانية (Free Sample Preview)
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            تذوق محتوى المنتج وقيم جودته التعليمية قبل الشراء:
          </p>

          <div className="p-5 bg-slate-950/70 rounded-2xl border border-white/10 text-xs text-slate-200 leading-relaxed whitespace-pre-line font-medium">
            {product.previewContent || (product.isFree ? 'هذا المورد التعليمي متاح بالكامل ومجاناً للجميع.' : 'تتوفر عينة مجانية للمعاينة.')}
          </div>
        </div>
      )}

      {/* Course Curriculum Breakdown (if product is a course) */}
      {product.modules && product.modules.length > 0 && (
        <div className="clean-card p-6 space-y-4 bg-[#0A1628]/90 border border-cyan-500/25 shadow-2xl backdrop-blur-xl rounded-3xl">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-cyan-400" /> محتوى الدورة التدريبية (Curriculum Modules)
          </h3>
          <div className="space-y-3">
            {product.modules.map((m) => (
              <div key={m.id} className="p-4 bg-slate-950/70 rounded-2xl border border-white/10 space-y-2">
                <h4 className="text-sm font-bold text-cyan-300">{m.title}</h4>
                <div className="space-y-1">
                  {m.lessons.map((l) => (
                    <div key={l.id} className="flex items-center justify-between text-xs text-slate-200 p-2.5 bg-slate-900/80 rounded-xl border border-white/5">
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-cyan-400" /> {l.title}
                      </span>
                      {l.videoUrl && <Badge variant="teal" size="sm">Video Lesson</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Reviews Section */}
      <ProductReviewSection
        productId={product.id}
        creatorId={product.creatorId}
        currentUserId={currentUser?.id}
        currentUserTeacherProfileId={currentUser?.teacherProfile?.id}
        initialReviews={product.reviews as any}
        ratingAverage={product.ratingAverage || 0}
        reviewCount={product.reviewCount || 0}
      />

      {/* Product Inquiries & Discussion Section */}
      <div className="clean-card p-6 sm:p-8 space-y-4 bg-[#0A1628]/90 border border-cyan-500/25 shadow-2xl backdrop-blur-xl rounded-3xl">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-cyan-400" /> أسئلة واستفسارات حول هذا المنتج ({product.comments?.length || 0})
        </h3>
        <p className="text-xs text-slate-400">
          اطرح استفساراتك المباشرة للأستاذ أو مؤلف المنتج التعليمي للحصول على توضيحات إضافية:
        </p>

        <CommentsSection
          targetType="PRODUCT"
          targetId={product.id}
          initialComments={product.comments as any}
          currentUserId={currentUser?.id}
          currentUserRole={currentUser?.role}
          defaultExpanded={true}
        />
      </div>
    </div>
  );
}