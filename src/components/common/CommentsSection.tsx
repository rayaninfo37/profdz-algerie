'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Send, Trash2, Lock } from 'lucide-react';
import AvatarFallback from '@/components/common/AvatarFallback';
import { RoleBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';

export interface CommentItem {
  id: string;
  content: string;
  createdAt: string | Date;
  user: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    role: string;
  };
}

export interface CommentsSectionProps {
  targetType: 'POST' | 'PRODUCT';
  targetId: string;
  initialComments?: CommentItem[];
  currentUserId?: string | null;
  currentUserRole?: string | null;
  defaultExpanded?: boolean;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  targetType,
  targetId,
  initialComments = [],
  currentUserId,
  currentUserRole,
  defaultExpanded = false,
}) => {
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      toast.error('يجب تسجيل الدخول لإضافة تعليق.');
      return;
    }

    const trimmed = newComment.trim();
    if (!trimmed) return;

    if (trimmed.length > 500) {
      toast.error('التعليق يجب ألا يتجاوز 500 حرف.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = targetType === 'POST'
        ? { postId: targetId, content: trimmed }
        : { productId: targetId, content: trimmed };

      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setComments((prev) => [...prev, data.comment]);
        setNewComment('');
        toast.success('تمت إضافة تعليقك بنجاح.');
      } else {
        toast.error(data.error || 'فشل في نشر التعليق.');
      }
    } catch {
      toast.error('حدث خطأ أثناء إرسال التعليق.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    setDeletingId(commentId);
    try {
      const res = await fetch(`/api/comments?id=${commentId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        toast.success('تم حذف التعليق.');
      } else {
        toast.error(data.error || 'فشل في حذف التعليق.');
      }
    } catch {
      toast.error('حدث خطأ أثناء حذف التعليق.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="pt-3 border-t border-white/5 space-y-3" dir="rtl">
      {!defaultExpanded && (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>النقاشات والاستفسارات ({comments.length})</span>
        </button>
      )}

      {(isOpen || defaultExpanded) && (
        <div className="space-y-4 pt-1">
          {comments.length > 0 ? (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {comments.map((c) => {
                const isAuthor = currentUserId === c.user.id;
                const canDelete = isAuthor || currentUserRole === 'ADMIN';

                return (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AvatarFallback
                          src={c.user.avatarUrl}
                          name={c.user.fullName}
                          role={c.user.role}
                          size={28}
                          className="w-7 h-7 rounded-lg text-[10px] border border-cyan-500/20"
                        />
                        <span className="text-xs font-bold text-white">{c.user.fullName}</span>
                        <RoleBadge role={c.user.role} size="sm" />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-sans">
                          {new Date(c.createdAt).toLocaleDateString('fr-DZ')}
                        </span>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(c.id)}
                            disabled={deletingId === c.id}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                            title="حذف التعليق"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed break-words pr-9">
                      {c.content}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-1">
              لا توجد استفسارات أو تعليقات بعد. كن أول من يطرح سؤالاً!
            </p>
          )}

          {currentUserId ? (
            <form onSubmit={handleSubmit} className="space-y-2 pt-1">
              <div className="relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  maxLength={500}
                  rows={2}
                  placeholder="اكتب استفسارك أو تعليقك التعليمي هنا..."
                  className="w-full text-xs p-3 pl-12 rounded-xl bg-slate-900 border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white placeholder-slate-500 resize-none outline-none"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  className="absolute left-2.5 bottom-3 p-1.5 rounded-lg bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 disabled:opacity-40 text-white shadow-md transition-all"
                  title="إرسال التعليق"
                >
                  <Send className="w-3.5 h-3.5 rotate-180" />
                </button>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
                <span>التعليقات مراقبة لضمان بيئة تعليمية محترمة.</span>
                <span>{newComment.length} / 500</span>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>يجب تسجيل الدخول لطرح استفسار أو كتابة تعليق.</span>
              </div>
              <Link href="/login">
                <Button variant="outline" size="sm" className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/50 text-xs py-1 h-7">
                  تسجيل الدخول
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
