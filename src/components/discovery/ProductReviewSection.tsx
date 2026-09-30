'use client';

import React, { useState } from 'react';
import { Star, MessageSquare, Plus, Check, Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import AvatarFallback from '@/components/common/AvatarFallback';

export interface ProductReviewItem {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date | string;
  user: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    wilaya?: string | null;
  };
}

export interface ProductReviewSectionProps {
  productId: string;
  creatorId: string;
  currentUserId?: string | null;
  currentUserTeacherProfileId?: string | null;
  initialReviews: ProductReviewItem[];
  ratingAverage: number;
  reviewCount: number;
}

export const ProductReviewSection: React.FC<ProductReviewSectionProps> = ({
  productId,
  creatorId,
  currentUserId,
  currentUserTeacherProfileId,
  initialReviews,
  ratingAverage: initialRatingAvg,
  reviewCount: initialReviewCount,
}) => {
  const [reviews, setReviews] = useState<ProductReviewItem[]>(initialReviews);
  const [ratingAverage, setRatingAverage] = useState<number>(initialRatingAvg);
  const [reviewCount, setReviewCount] = useState<number>(initialReviewCount);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Edit state
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [pendingEditData, setPendingEditData] = useState<{ rating: number; comment: string } | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const isOwner = Boolean(currentUserTeacherProfileId && currentUserTeacherProfileId === creatorId);
  const hasAlreadyReviewed = Boolean(currentUserId && reviews.some((r) => r.user.id === currentUserId));
  const myReview = reviews.find((r) => r.user.id === currentUserId);

  const recalcAggregate = (updatedReviews: ProductReviewItem[]) => {
    const count = updatedReviews.length;
    const avg = count > 0
      ? Math.round((updatedReviews.reduce((a, r) => a + r.rating, 0) / count) * 10) / 10
      : 0;
    setReviewCount(count);
    setRatingAverage(avg);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId || isOwner || hasAlreadyReviewed) return;
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await res.json();
      if (data.success && data.review) {
        const updatedReviews = [data.review, ...reviews];
        setReviews(updatedReviews);
        recalcAggregate(updatedReviews);
        setComment('');
        setShowForm(false);
        setSuccessMessage('تم نشر تقييمك بنجاح!');
      } else {
        setError(data.error || 'فشل في إرسال التقييم');
      }
    } catch {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditForm = (rev: ProductReviewItem) => {
    setEditingReviewId(rev.id);
    setEditRating(rev.rating);
    setEditComment(rev.comment);
    setShowEditConfirm(false);
    setPendingEditData(null);
  };

  const requestEditConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setPendingEditData({ rating: editRating, comment: editComment });
    setShowEditConfirm(true);
  };

  const confirmEdit = async () => {
    if (!pendingEditData) return;
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: pendingEditData.rating, comment: pendingEditData.comment }),
      });
      const data = await res.json();
      if (data.success && data.review) {
        const updated = reviews.map((r) =>
          r.user.id === currentUserId ? { ...r, ...data.review } : r
        );
        setReviews(updated);
        recalcAggregate(updated);
        setEditingReviewId(null);
        setShowEditConfirm(false);
        setPendingEditData(null);
        setSuccessMessage('تم تحديث تقييمك بنجاح.');
      } else {
        setError(data.error || 'فشل تحديث التقييم.');
        setShowEditConfirm(false);
      }
    } catch {
      setError('خطأ في الاتصال.');
      setShowEditConfirm(false);
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <div className="clean-card p-6 sm:p-8 space-y-6 bg-[#0A1628]/90 border border-cyan-500/25 shadow-2xl backdrop-blur-xl rounded-3xl text-slate-100" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" /> تقييمات المنتج التعليمي ({reviewCount})
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-black text-amber-400 font-mono">
              {ratingAverage > 0 ? ratingAverage.toFixed(1) : '—'}
            </span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`w-4 h-4 ${s <= Math.round(ratingAverage) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
              ))}
            </div>
            <span className="text-xs text-slate-400">({reviewCount} تقييم)</span>
          </div>
        </div>
        {!isOwner && currentUserId && !hasAlreadyReviewed && !showForm && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}
            className="gap-1.5 border-amber-500/50 text-amber-400 hover:bg-amber-950/40 font-bold">
            <Plus className="w-4 h-4" /> أضف تقييمك
          </Button>
        )}
      </div>

      {isOwner && (
        <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs rounded-xl">
          أنت صاحب هذا المنتج — لا يمكنك تقييم منتجك بنفسك.
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-teal-950/80 border border-teal-700 text-teal-300 text-xs rounded-xl font-bold flex items-center gap-2">
          <Check className="w-4 h-4" /> {successMessage}
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl font-bold">
          {error}
        </div>
      )}

      {/* New Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="clean-card p-5 space-y-4 bg-slate-950/80 border border-amber-500/30 rounded-2xl">
          <h4 className="text-sm font-bold text-white">إضافة تقييم</h4>
          <div className="space-y-2">
            <label className="text-xs text-slate-300 font-bold block">التقييم بالنجوم:</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button type="button" key={star} onClick={() => setRating(star)} className="p-1 hover:scale-110 transition-transform">
                  <Star className={`w-6 h-6 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                </button>
              ))}
              <span className="text-xs font-bold text-amber-400 mr-2">({rating}/5)</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-bold block">تجربتك مع هذا المحتوى:</label>
            <textarea required rows={3} value={comment} onChange={(e) => setComment(e.target.value)}
              placeholder="اكتب رأيك بصراحة..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500" />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setShowForm(false)} className="border-slate-700 text-slate-300">إلغاء</Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">نشر التقييم</Button>
          </div>
        </form>
      )}

      {/* Edit Confirm Dialog */}
      {showEditConfirm && pendingEditData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#0A1628] border border-amber-700/50 rounded-2xl p-6 w-full max-w-sm space-y-4" dir="rtl">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Pencil className="w-4 h-4 text-amber-400" /> تأكيد تعديل التقييم
            </h4>
            <p className="text-xs text-slate-300">
              هل أنت متأكد من تعديل تقييمك إلى <strong className="text-amber-400">{pendingEditData.rating} نجوم</strong>؟
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowEditConfirm(false)} className="border-slate-700 text-slate-300" disabled={editSubmitting}>إلغاء</Button>
              <Button variant="primary" size="sm" isLoading={editSubmitting} onClick={confirmEdit} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">تأكيد التعديل</Button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map((rev) => {
            const isMyReview = rev.user.id === currentUserId;
            const isEditing = editingReviewId === rev.id;

            return (
              <div key={rev.id} className="p-4 bg-slate-950/70 border border-white/10 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <AvatarFallback src={rev.user.avatarUrl} name={rev.user.fullName} size={32}
                      className="w-8 h-8 rounded-full border border-amber-500/50" />
                    <div>
                      <h4 className="text-xs font-bold text-white">{rev.user.fullName}</h4>
                      <span className="text-[10px] text-slate-400">{rev.user.wilaya || 'مستفيد'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} />
                      ))}
                    </div>
                    {isMyReview && !isEditing && (
                      <button onClick={() => openEditForm(rev)}
                        className="p-1 text-slate-400 hover:text-amber-400 hover:bg-amber-950/40 rounded-lg transition-colors"
                        title="تعديل تقييمك">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isEditing && (
                      <button onClick={() => setEditingReviewId(null)} className="p-1 text-slate-400 hover:text-white rounded-lg">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline edit form */}
                {isEditing ? (
                  <form onSubmit={requestEditConfirm} className="space-y-3 pt-2 border-t border-white/10">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button type="button" key={star} onClick={() => setEditRating(star)} className="p-0.5 hover:scale-110 transition-transform">
                          <Star className={`w-5 h-5 ${star <= editRating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                        </button>
                      ))}
                      <span className="text-xs text-amber-400 mr-2 font-bold">({editRating}/5)</span>
                    </div>
                    <textarea rows={2} value={editComment} onChange={(e) => setEditComment(e.target.value)}
                      required maxLength={1000}
                      className="w-full px-3 py-2 bg-slate-900 border border-amber-500/40 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500" />
                    <div className="flex gap-2 justify-end">
                      <Button type="button" variant="outline" size="sm" onClick={() => setEditingReviewId(null)} className="border-slate-700 text-slate-300 text-xs">إلغاء</Button>
                      <Button type="submit" variant="primary" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs">حفظ التعديل</Button>
                    </div>
                  </form>
                ) : (
                  rev.comment && <p className="text-xs text-slate-300 leading-relaxed pr-10">{rev.comment}</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-950/40 border border-white/5 rounded-2xl text-slate-400 text-xs">
          لا توجد تقييمات بعد. كن أول من يضيف تقييماً!
        </div>
      )}
    </div>
  );
};
