'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { PostCard } from '@/components/feed/PostCard';
import { CreatePostModal } from '@/components/feed/CreatePostModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plus, MessageSquare, HelpCircle, UserSearch, BookOpen, Lightbulb } from 'lucide-react';

export interface FeedClientViewProps {
  initialPosts: any[];
  currentUser?: any;
  activeType?: string;
  activeChannel?: string;
}

const CHANNELS = [
  { id: 'TEACHERS', label: 'خلاصة الأساتذة 🎓' },
  { id: 'STUDENTS', label: 'مجتمع الطلبة 📚' },
  { id: 'PARENTS', label: 'مجتمع الأولياء 👨‍👩‍👧' },
];

const CATEGORIES = [
  { id: 'ALL', label: 'جميع المواضيع', icon: MessageSquare },
  { id: 'STUDENT_QUESTION', label: 'أسئلة واستفسارات', icon: HelpCircle },
  { id: 'TEACHER_REQUEST', label: 'أبحث عن أستاذ', icon: UserSearch },
  { id: 'TIP', label: 'نصائح وتوجيهات', icon: Lightbulb },
  { id: 'EXPLANATION', label: 'شروحات وتمارين', icon: BookOpen },
];

export const FeedClientView: React.FC<FeedClientViewProps> = ({
  initialPosts,
  currentUser,
  activeType = 'ALL',
  activeChannel = 'TEACHERS',
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(activeType);
  const [selectedChannel, setSelectedChannel] = useState(activeChannel);

  const canPost = currentUser && (
    currentUser.role === 'TEACHER' ||
    currentUser.role === 'STUDENT' ||
    currentUser.role === 'PARENT' ||
    currentUser.role === 'ADMIN'
  );

  const handleSelectChannel = (channelId: string) => {
    setSelectedChannel(channelId);
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    params.set('channel', channelId);
    router.push(`/feed?${params.toString()}`);
  };

  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    if (catId === 'ALL') {
      params.delete('type');
    } else {
      params.set('type', catId);
    }
    router.push(`/feed?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Channel Switch Bar (Builders / CampusFlow Tabs Style) */}
      <div className="flex items-center gap-2 p-1.5 bg-[#0B132B]/85 border border-cyan-500/20 rounded-2xl overflow-x-auto shadow-lg backdrop-blur-md">
        {CHANNELS.map((ch) => {
          const isSelected = selectedChannel === ch.id;
          return (
            <button
              key={ch.id}
              type="button"
              onClick={() => handleSelectChannel(ch.id)}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all text-center whitespace-nowrap ${
                isSelected
                  ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-cyan-500/20'
                  : 'bg-transparent text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              {ch.label}
            </button>
          );
        })}
      </div>

      {/* Top Action Bar: Categories & New Post CTA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-[#0B132B]/85 border border-cyan-500/20 rounded-2xl shadow-lg backdrop-blur-md">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-500/50 shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Create Post Button */}
        {canPost ? (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>نشر سؤال أو إرشاد</span>
          </Button>
        ) : (
          <Link href="/login" className="shrink-0">
            <Button variant="outline" size="sm" className="border-teal-600 text-teal-300 text-xs">
              سجل الدخول للمشاركة
            </Button>
          </Link>
        )}
      </div>

      {/* Posts Stream */}
      <div className="space-y-6">
        {initialPosts.length > 0 ? (
          initialPosts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={currentUser?.id} />
          ))
        ) : (
          <div className="clean-card p-12 text-center text-stone-400 text-xs bg-[#111D38] border border-[#1E3A5F] rounded-2xl space-y-2">
            <p className="text-sm font-bold text-white">لا توجد منشورات في هذا القسم حالياً.</p>
            <p>كن أول من يطرح سؤالاً أو يشارك نصيحة تعليمية مفيدة لزملائك وأساتذتك.</p>
            {canPost && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateModalOpen(true)}
                className="mt-3 border-teal-600 text-teal-300"
              >
                إنشاء أول منشور الآن
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        currentUser={currentUser}
        onPostCreated={() => window.location.reload()}
      />
    </div>
  );
};
