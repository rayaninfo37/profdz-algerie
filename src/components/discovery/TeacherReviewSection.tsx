'use client';

import React, { useState } from 'react';
import { Star, MessageSquare, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import AvatarFallback from '@/components/common/AvatarFallback';
import Link from 'next/link';

export interface TeacherReviewSectionProps {
  teacherProfileId: string;
  teacherUserId: string;
  currentUserId?: string | null;
  initialReviews: Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: Date | string;
    author: {
      id: string;
      fullName: string;
      avatarUrl?: string | null;
      wilaya?: string | null;
    };
  }>;
}

export const TeacherReviewSection: React.FC<TeacherReviewSectionProps> = ({
  teacherProfileId,
  teacherUserId,
  currentUserId,
  initialReviews,
}) => {
  const [reviews, setReviews] = useState(initialReviews);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const isSelf = currentUserId === teacherUserId;
  const hasAlreadyReviewed = currentUserId ? reviews.some((r) => r.author.id === currentUserId) : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) return;
    if (isSelf) {
      setError('لا يمكنك تقييم ملفك الشخصي.');
      return;
    }
    if (hasAlreadyReviewed) {
      setError('لقد قمت بتقييم هذا الأستاذ مسبقاً.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: teacherProfileId,
          targetType: 'TEACHER',
          rating,
          comment,
        }),
      });
      const data = await res.json();
      if (data.success && data.review) {
        setReviews([data.review, ...reviews]);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-amber-400" /> تقييمات ومراجعات الطلاب الموثقة ({reviews.length})
        </h3>

        {!isSelf && currentUserId && !hasAlreadyReviewed && !showForm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(true)}
            className="gap-1.5 border-amber-500/50 text-amber-400 hover:bg-amber-950 font-bold"
          >
            <Plus className="w-4 h-4" /> أضف تقييمك
          </Button>
        )}
      </div>

      {isSelf && (
        <div className="p-3 bg-slate-900/80 border border-slate-800 text-stone-400 text-xs rounded-xl">
          أنت تشاهد ملفك الشخصي كأستاذ (لا يمكنك تقييم نفسك).
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-teal-950/80 border border-teal-700 text-teal-300 text-xs rounded-xl font-bold flex items-center gap-2">
          <Check className="w-4 h-4" /> {successMessage}
        </div>
      )}

      {/* Review Submission Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="clean-card p-5 space-y-4 bg-[#111D38] border border-[#1E3A5F]">
          <h4 className="text-sm font-bold text-white">إضافة تقييم ومراجعة جديدة</h4>

          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-xl font-bold">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs text-stone-300 font-bold block">التقييم بالنجوم:</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-amber-400 mr-2">({rating} من 5 نجوم)</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-stone-300 font-bold block">تعليقك وتجربتك التعليمية مع الأستاذ:</label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="اكتب تجربتك بصراحة ودقة لمساعدة بقية الطلاب وأولياء الأمور..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setShowForm(false)}
              className="border-slate-700 text-stone-300"
            >
              إلغاء
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={isSubmitting}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
            >
              نشر التقييم
            </Button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map((rev) => (
            <div key={rev.id} className="clean-card p-4 space-y-2 bg-[#111D38] border border-[#1E3A5F]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <AvatarFallback
                    src={rev.author.avatarUrl}
                    name={rev.author.fullName}
                    size={32}
                    className="w-8 h-8 rounded-full border border-teal-500"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white">{rev.author.fullName}</h4>
                    <span className="text-[10px] text-stone-400">{rev.author.wilaya || 'طالب'}</span>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {rev.comment && (
                <p className="text-xs text-stone-300 leading-relaxed pr-10">{rev.comment}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center clean-card text-stone-400 text-xs bg-[#111D38] border border-[#1E3A5F]">
          لا توجد تقييمات مكتوبة بعد. كن أول من يكتب مراجعة موثقة!
        </div>
      )}
    </div>
  );
};
