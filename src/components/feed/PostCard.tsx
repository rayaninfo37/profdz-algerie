'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, MessageSquare, ShieldCheck, Send, Trash2, Film, Image as ImageIcon, AlertTriangle, Flag } from 'lucide-react';
import { Badge, RoleBadge } from '@/components/ui/Badge';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { Button } from '@/components/ui/Button';
import AvatarFallback from '@/components/common/AvatarFallback';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { CommentsSection } from '@/components/common/CommentsSection';

export interface PostCardProps {
  post: {
    id: string;
    title?: string | null;
    content: string;
    postType: string;
    subject?: string | null;
    educationLevel?: string | null;
    mediaUrl?: string | null;
    viewsCount: number;
    createdAt: string | Date;
    author: {
      id: string;
      fullName: string;
      avatarUrl?: string | null;
      role: string;
      teacherProfile?: { id: string; headline?: string | null; isVerified: boolean } | null;
      institutionProfile?: { id: string; name: string; isVerified: boolean } | null;
    };
    likes?: Array<{ userId: string }>;
    comments?: Array<{ id: string; content: string; user: { fullName: string; avatarUrl?: string | null } }>;
  };
  currentUserId?: string | null;
  onPostDeleted?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, currentUserId, onPostDeleted }) => {
  const toast = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('محتوى غير لائق أو مخالف');
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const handleReportPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      toast.error('يجب تسجيل الدخول لتقديم بلاغ.');
      return;
    }
    setIsSubmittingReport(true);
    try {
      const res = await fetch('/api/community/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: 'POST',
          targetId: post.id,
          reason: reportReason,
          details: reportDetails.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'تم استلام شكواك وبلاغك بنجاح.');
        setReportModalOpen(false);
        setReportDetails('');
      } else {
        toast.error(data.error || 'فشل في إرسال البلاغ.');
      }
    } catch {
      toast.error('حدث خطأ في الشبكة.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleDeletePost = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/posts?id=${post.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('تم حذف المنشور بنجاح.');
        setConfirmDeleteOpen(false);
        if (onPostDeleted) onPostDeleted(post.id);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'فشل في حذف المنشور.');
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء حذف المنشور.');
    } finally {
      setIsDeleting(false);
    }
  };

  const isOwner = currentUserId === post.author.id;
  const isVerified = post.author.teacherProfile?.isVerified || post.author.institutionProfile?.isVerified;
  const isVideoMedia = post.mediaUrl && (post.mediaUrl.endsWith('.mp4') || post.mediaUrl.endsWith('.webm'));

  return (
    <div className="bg-[#0A1628]/85 border border-cyan-400/25 hover:border-cyan-400/60 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl hover:shadow-[0_0_25px_rgba(56,189,248,0.25)] backdrop-blur-xl transition-all duration-300">
      {/* Author Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AvatarFallback
            src={post.author.avatarUrl}
            name={post.author.fullName}
            role={post.author.role}
            size={42}
            className="w-10 h-10 rounded-2xl border border-cyan-400/40 object-cover shadow-sm"
          />
          <div>
            <div className="flex items-center gap-1.5">
              {post.author.teacherProfile ? (
                <Link href={`/teachers/${post.author.teacherProfile.id}`} className="hover:underline">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-sm font-bold text-white flex items-center gap-1 hover:text-cyan-300 transition-colors">
                      {post.author.fullName}
                      {isVerified && <VerifiedBadge size="sm" />}
                    </h4>
                    <RoleBadge role={post.author.role} size="sm" />
                  </div>
                </Link>
              ) : (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="text-sm font-bold text-white flex items-center gap-1">
                    {post.author.fullName}
                    {isVerified && <VerifiedBadge size="sm" />}
                  </h4>
                  <RoleBadge role={post.author.role} size="sm" />
                </div>
              )}
            </div>
            <p className="text-[11px] text-cyan-400 font-semibold">
              {post.author.teacherProfile?.headline || post.author.role}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="teal" size="sm" className="font-bold bg-cyan-950/60 border-cyan-500/40 text-cyan-300">
            {post.postType === 'TIP'
              ? '💡 نصيحة وتوجيه'
              : post.postType === 'EXPLANATION'
              ? '📖 شرح وتوضيح'
              : post.postType === 'EXERCISE'
              ? '✍️ تمرين ونموذج'
              : post.postType === 'ANNOUNCEMENT'
              ? '📢 إعلان أكاديمي'
              : post.postType === 'VIDEO_PREVIEW'
              ? '🎬 فيديو تعليمي'
              : post.postType}
          </Badge>

          {!isOwner && (
            <button
              onClick={() => setReportModalOpen(true)}
              className="p-1.5 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
              title="تقديم شكوى أو إبلاغ عن المنشور (Report Post)"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          )}

          {isOwner && (
            <button
              onClick={() => setConfirmDeleteOpen(true)}
              disabled={isDeleting}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              title="حذف المنشور (Delete Post)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Title & Tags */}
      {(post.title || post.subject || post.educationLevel) && (
        <div className="space-y-1.5">
          {post.title && <h3 className="text-base font-bold text-white leading-snug">{post.title}</h3>}
          <div className="flex gap-1.5 flex-wrap">
            {post.subject && <Badge variant="teal" size="sm" className="bg-cyan-950/40 border-cyan-500/20 text-cyan-300">{post.subject}</Badge>}
            {post.educationLevel && <Badge variant="slate" size="sm" className="bg-slate-800 border-white/10 text-slate-300">{post.educationLevel}</Badge>}
          </div>
        </div>
      )}

      {/* Post Content Body */}
      <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-[#081223] p-4 rounded-xl border border-white/5 break-words [overflow-wrap:anywhere] min-w-0 max-w-full">
        {post.content}
      </div>

      {/* Media Rendering (Image / Video) */}
      {post.mediaUrl && (
        <div className="rounded-xl overflow-hidden border border-white/10 bg-[#06101D] max-h-96 flex items-center justify-center">
          {isVideoMedia ? (
            <video src={post.mediaUrl} controls className="w-full max-h-96 object-contain" />
          ) : (
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="w-full h-full cursor-zoom-in group relative block"
              title="انقر لتكبير الصورة (Click to view full image)"
            >
              <img
                src={post.mediaUrl}
                alt="Post Attachment"
                className="w-full max-h-96 object-cover group-hover:opacity-95 transition-opacity"
              />
            </button>
          )}
        </div>
      )}

      {/* Announcement Footer: Date & Read/View indicator */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-cyan-300 font-medium">
            إعلان / منشور توجيهي رسمي
          </span>
        </div>

        <span className="text-[11px] text-slate-400 font-sans">
          {new Date(post.createdAt).toLocaleDateString('fr-DZ')}
        </span>
      </div>

      {/* Questions & Discussion Section */}
      <CommentsSection
        targetType="POST"
        targetId={post.id}
        initialComments={post.comments as any}
        currentUserId={currentUserId}
      />

      {/* In-App Delete Confirmation Modal */}
      {confirmDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn" dir="rtl">
          <div className="w-full max-w-sm p-6 space-y-4 bg-[#0B172E] border border-rose-500/40 text-slate-100 shadow-2xl rounded-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-700/60 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">تأكيد حذف المنشور التعليمي</h4>
                <p className="text-xs text-slate-300">هل أنت متأكد من رغبتك في حذف هذا المنشور نهائياً؟</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDeleteOpen(false)}
                className="border-white/10 text-slate-300 hover:bg-white/5"
              >
                إلغاء
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeletePost}
                isLoading={isDeleting}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
              >
                تأكيد الحذف
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Post Images */}
      {lightboxOpen && post.mediaUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center">
            <img
              src={post.mediaUrl}
              alt="Full Size View"
              className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl"
            />
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-2 right-2 px-3 py-1 bg-black/60 hover:bg-black/80 text-white text-xs font-bold rounded-full border border-white/20"
            >
              إغلاق (✕)
            </button>
          </div>
        </div>
      )}

      {/* Community Report / Complaint Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn" dir="rtl">
          <div className="w-full max-w-md p-6 space-y-4 bg-[#0B172E] border border-amber-500/40 text-slate-100 shadow-2xl rounded-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-950/80 border border-amber-600/50 flex items-center justify-center text-amber-400 shrink-0">
                <Flag className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">تقديم شكوى / إبلاغ عن منشور</h4>
                <p className="text-[11px] text-slate-400">ساعدنا في الحفاظ على بيئة تعليمية محترمة وآمنة 🇩🇿</p>
              </div>
            </div>

            <form onSubmit={handleReportPost} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-amber-300">سبب الإبلاغ أو الشكوى</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="محتوى غير لائق أو مخالف">محتوى غير لائق أو مسيء للأخلاق</option>
                  <option value="معلومات تعليمية مضللة أو خاطئة">معلومات أو حلول تعليمية مضللة</option>
                  <option value="إعلانات تجارية مزعجة (Spam)">إعلانات مزعجة أو روابط مشبوهة (Spam)</option>
                  <option value="انتحال شخصية أو جهة رسمية">انتحال شخصية أستاذ أو مؤسسة</option>
                  <option value="أخرى">سبب آخر</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">تفاصيل إضافية (اختياري)</label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="يرجى توضيح سبب الشكوى بدقة لمساعدة فريق الرقابة الإدارية..."
                  rows={3}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="border-white/10 text-slate-300 hover:bg-white/5"
                >
                  إلغاء
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  isLoading={isSubmittingReport}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold"
                >
                  إرسال البلاغ للإدارة
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
