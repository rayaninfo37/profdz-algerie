'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, MapPin, Star, MessageSquare, Phone, ExternalLink, UserPlus, Check, Lock, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge, RoleBadge } from '@/components/ui/Badge';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { AvatarFallback } from '@/components/common/AvatarFallback';
import { Modal } from '@/components/ui/Modal';
import { KRYTY_ASSETS } from '@/lib/assets';
import { useToast } from '@/context/ToastContext';
import { useLocale } from '@/context/LocaleContext';
import { generateTeacherSlug } from '@/lib/teacherVisibility';

export interface TeacherCardProps {
  teacher: {
    id: string;
    userId: string;
    headline?: string | null;
    bio?: string | null;
    subjects: string;
    educationLevels: string;
    teachingMode: string;
    experienceYears: number;
    isVerified: boolean;
    professionalTitle?: string | null;
    subscriptionState: string;
    priceMin?: number | null;
    priceMax?: number | null;
    phone?: string | null;
    whatsapp?: string | null;
    telegram?: string | null;
    facebook?: string | null;
    user: {
      id: string;
      fullName: string;
      avatarUrl?: string | null;
      wilaya?: string | null;
    };
    _count?: {
      reviews?: number;
      reachEvents?: number;
    };
    reviews?: Array<{ rating: number }>;
    ratingAverage?: number;
  };
  rank?: number;
  isAuthenticated?: boolean;
  /** When true, hides the Contact button (used on homepage) */
  hideContact?: boolean;
}

export const TeacherCard: React.FC<TeacherCardProps> = ({
  teacher,
  rank,
  isAuthenticated = false,
  hideContact = false,
}) => {
  const toast = useToast();
  const { t, locale, dir } = useLocale();
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isAuth, setIsAuth] = useState(isAuthenticated);

  React.useEffect(() => {
    if (!isAuthenticated) {
      import('@/lib/clientAuth').then(({ getClientAuth }) => {
        getClientAuth().then((data) => {
          if (data.authenticated) setIsAuth(true);
        });
      });
    } else {
      setIsAuth(true);
    }
  }, [isAuthenticated]);

  const subjectsList: string[] = typeof teacher.subjects === 'string'
    ? JSON.parse(teacher.subjects || '[]')
    : teacher.subjects || [];

  const hasContactMethod = Boolean(teacher.phone || teacher.whatsapp || teacher.telegram);

  const isFrozen = teacher.subscriptionState === 'FROZEN';

  const reviewCount = teacher._count?.reviews ?? (teacher.reviews ? teacher.reviews.length : 0);
  const rawAvg = teacher.ratingAverage ?? (teacher.reviews && teacher.reviews.length > 0
    ? teacher.reviews.reduce((sum, r) => sum + r.rating, 0) / teacher.reviews.length
    : 0);
  const formattedRating = rawAvg > 0 ? (Math.round(rawAvg * 10) / 10).toFixed(1) : null;

  const priceDisplay = (() => {
    if (teacher.priceMin !== undefined && teacher.priceMin !== null && teacher.priceMax !== undefined && teacher.priceMax !== null) {
      if (teacher.priceMin === teacher.priceMax) {
        return `${teacher.priceMin.toLocaleString()} دج / حصة`;
      }
      return `من ${teacher.priceMin.toLocaleString()} إلى ${teacher.priceMax.toLocaleString()} دج`;
    }
    if (teacher.priceMin !== undefined && teacher.priceMin !== null) {
      return `من ${teacher.priceMin.toLocaleString()} دج`;
    }
    if (teacher.priceMax !== undefined && teacher.priceMax !== null) {
      return `حتى ${teacher.priceMax.toLocaleString()} دج`;
    }
    return t.discovery.priceOnContact;
  })();

  const handleOpenContact = async () => {
    try {
      await fetch(`/api/teachers/${teacher.id}/reach`, { method: 'POST' });
    } catch (e) {}
    setContactModalOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: teacher.id,
          targetType: 'TEACHER',
          rating,
          comment: reviewComment,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('تم تقديم تقييمك بنجاح! شكراً لك.');
        setReviewModalOpen(false);
        setReviewComment('');
      } else {
        toast.error(data.error || 'فشل في إرسال التقييم.');
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء إرسال التقييم.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <>
      <div className="relative group bg-[#0A1628]/80 border border-cyan-500/20 hover:border-cyan-500/50 rounded-2xl p-5 sm:p-6 flex flex-col justify-between text-slate-100 space-y-4 shadow-xl backdrop-blur-xl hover:shadow-cyan-500/10 hover:-translate-y-0.5 transition-all duration-300">
        {/* Frozen Overlay / Badge if Reach Limit Exceeded */}
        {isFrozen && (
          <div className="absolute top-3 right-3 z-10">
            <Badge variant="burgundy" size="sm" className="gap-1 bg-rose-950/80 border-rose-500/40 text-rose-300">
              <Lock className="w-3 h-3" /> انتهت الفترة التجريبية (FROZEN)
            </Badge>
          </div>
        )}

        <div className="space-y-4">
          {/* Header info: Elevated portrait dominance */}
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <AvatarFallback
                src={teacher.user.avatarUrl}
                name={teacher.user.fullName}
                size={64}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-500/30 shadow-md group-hover:border-cyan-400 transition-colors"
              />
              
              {teacher.isVerified && (
                <div className="absolute -bottom-1 -right-1 shadow-xs">
                  <VerifiedBadge size="sm" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <Link href={`/teachers/${generateTeacherSlug(teacher.user.fullName, teacher.id)}`} className="hover:underline">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-base font-bold text-white tracking-tight truncate group-hover:text-cyan-300 transition-colors">
                    {teacher.user.fullName}
                  </h3>
                  <RoleBadge
                    role="TEACHER"
                    professionalTitle={teacher.professionalTitle}
                    size="sm"
                  />
                  {teacher.isVerified && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                      {t.discovery.trusted}
                    </span>
                  )}
                </div>
              </Link>

              {teacher.headline && (
                <p className="text-xs text-cyan-300/90 font-semibold truncate">
                  {teacher.headline}
                </p>
              )}

              <div className="flex items-center gap-3 pt-0.5 text-xs text-slate-400">
                {teacher.user.wilaya && (
                  <span className="flex items-center gap-1 text-slate-300 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    {teacher.user.wilaya}
                  </span>
                )}
                <button
                  onClick={() => setReviewModalOpen(true)}
                  className="flex items-center gap-1 text-amber-400 font-bold hover:underline"
                >
                  <Star className={`w-3.5 h-3.5 ${reviewCount > 0 ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                  {reviewCount > 0 ? (
                    <span>{formattedRating} ★ ({reviewCount} {t.discovery.reviews})</span>
                  ) : (
                    <span className="text-slate-500 font-normal">{t.discovery.newBadge} (0 {t.discovery.reviews})</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Subjects & Educational Attributes */}
          <div className="space-y-2.5 pt-1">
            <div className="flex flex-wrap gap-1.5">
              {subjectsList.map((sub, i) => (
                <span key={i} className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-cyan-300">
                  {sub}
                </span>
              ))}
              {teacher.teachingMode && (
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-lg bg-slate-800/80 border border-white/5 text-slate-300">
                  {teacher.teachingMode === 'ONLINE' ? t.discovery.online : teacher.teachingMode === 'IN_PERSON' ? t.discovery.inPerson : t.discovery.hybrid}
                </span>
              )}
            </div>

            {/* Decision Fields: Structured Price indicator & Education Level */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
              <span className="text-cyan-300 font-semibold truncate max-w-[65%]">
                {teacher.educationLevels ? `${t.discovery.levelLabel}: ${typeof teacher.educationLevels === 'string' && teacher.educationLevels.startsWith('[') ? JSON.parse(teacher.educationLevels).join('، ') : teacher.educationLevels}` : t.common.allLevels}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-900 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] font-bold">
                {priceDisplay}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Single clear primary CTA is 'عرض الملف'. Secondary 'تواصل' only if contact method exists AND hideContact=false */}
        <div className={`grid ${hasContactMethod && !hideContact ? 'grid-cols-2' : 'grid-cols-1'} gap-2.5 pt-3.5 border-t border-white/5`}>
          <Link href={`/teachers/${generateTeacherSlug(teacher.user.fullName, teacher.id)}`} className="w-full">
            <Button
              variant="primary"
              size="sm"
              className="w-full h-10 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold text-sm rounded-xl shadow-md shadow-cyan-500/20 transition-all border-0"
            >
              عرض الملف
            </Button>
          </Link>

          {hasContactMethod && !hideContact && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenContact}
              className="w-full h-10 border-white/15 text-slate-200 bg-slate-900/70 hover:bg-slate-800 hover:text-white hover:border-cyan-500/40 rounded-xl font-medium transition-all"
            >
              <Phone className="w-3.5 h-3.5 text-cyan-400" /> {t.discovery.contact}
            </Button>
          )}
        </div>
      </div>

      {/* External Contact Modal Drawer */}
      <Modal isOpen={contactModalOpen} onClose={() => setContactModalOpen(false)} title={`${t.discovery.contact} ${teacher.user.fullName}`}>
        <div className="space-y-4 text-slate-200">
          {!isAuth ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3.5 bg-cyan-950/40 border border-cyan-500/30 rounded-xl">
                <Lock className="w-6 h-6 text-cyan-400 shrink-0" />
                <p className="text-xs text-slate-300 leading-relaxed">
                  {t.discovery.authRequiredContact}
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <Link href="/login" className="flex-1">
                  <Button variant="primary" size="sm" className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold">
                    {t.common.login}
                  </Button>
                </Link>
                <Link href="/register" className="flex-1">
                  <Button variant="outline" size="sm" className="w-full border-white/10 text-slate-200 bg-slate-900/60 hover:bg-slate-800">
                    {t.common.register}
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-400">
                يمكنك التواصل مباشرة مع الأستاذ عبر الوسائل المتاحة:
              </p>

              <div className="space-y-2">
                {teacher.phone && (
                  <a
                    href={`tel:${teacher.phone}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-white/10 hover:border-cyan-500/40 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-bold text-white font-mono" dir="ltr">{teacher.phone}</span>
                    </div>
                    <span className="text-[10px] text-cyan-400 group-hover:underline">اتصال</span>
                  </a>
                )}

                {teacher.whatsapp && (
                  <a
                    href={`https://wa.me/${teacher.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-white/10 hover:border-emerald-500/40 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <ExternalLink className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white">واتساب (WhatsApp)</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 group-hover:underline">مراسلة</span>
                  </a>
                )}

                {teacher.telegram && (
                  <a
                    href={`https://t.me/${teacher.telegram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-white/10 hover:border-sky-500/40 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <ExternalLink className="w-4 h-4 text-sky-400" />
                      <span className="text-xs font-bold text-white">تيليغرام (Telegram)</span>
                    </div>
                    <span className="text-[10px] text-sky-400 group-hover:underline">مراسلة</span>
                  </a>
                )}

                {teacher.facebook && (
                  <a
                    href={teacher.facebook.startsWith('http') ? teacher.facebook : `https://facebook.com/${teacher.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-white/10 hover:border-blue-500/40 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <ExternalLink className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-white">فيسبوك (Facebook)</span>
                    </div>
                    <span className="text-[10px] text-blue-400 group-hover:underline">زيارة الحساب</span>
                  </a>
                )}

                {!teacher.phone && !teacher.whatsapp && !teacher.telegram && !teacher.facebook && (
                  <p className="text-xs text-slate-500 italic text-center py-4">لم يقم الأستاذ بإضافة وسائل تواصل عامة حالياً.</p>
                )}
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Write a Review Modal */}
      <Modal isOpen={reviewModalOpen} onClose={() => setReviewModalOpen(false)} title={`تقييم ${teacher.user.fullName}`}>
        <form onSubmit={handleSubmitReview} className="space-y-4 text-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">التقييم العام</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star className={`w-6 h-6 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">تعليقك (اختياري)</label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={3}
              placeholder="اكتب تجربتك مع الأستاذ بموضوعية..."
              className="w-full text-xs p-3 rounded-xl bg-slate-900 border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white placeholder-slate-500 resize-none outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReviewModalOpen(false)}
              className="border-white/10 text-slate-300 hover:bg-white/5"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmittingReview}
              className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold"
            >
              <Send className="w-3.5 h-3.5 ml-1.5" />
              {isSubmittingReview ? 'جارٍ الإرسال...' : 'نشر التقييم'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
