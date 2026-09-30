'use client';

import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { buildYouTubeEmbedUrl } from '@/lib/youtubeUtils';

interface YouTubePlayerProps {
  videoId: string;
  title?: string;
}

/**
 * Privacy-enhanced YouTube embed. Only loads iframe on user click (no tracking until then).
 */
export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ videoId, title }) => {
  const [playing, setPlaying] = useState(false);
  const embedUrl = buildYouTubeEmbedUrl(videoId);
  const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  if (!embedUrl) return null;

  if (playing) {
    return (
      <div className="relative w-full rounded-xl overflow-hidden bg-black aspect-video">
        <iframe
          src={`${embedUrl}?autoplay=1&rel=0&modestbranding=1`}
          title={title || 'فيديو تعليمي'}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="relative w-full rounded-xl overflow-hidden bg-black aspect-video group focus:outline-none"
      aria-label="تشغيل الفيديو"
    >
      <img
        src={thumbUrl}
        alt={title || 'فيديو تعليمي'}
        className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
        loading="lazy"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-red-600/90 flex items-center justify-center shadow-xl group-hover:bg-red-500 transition-colors">
          <Play className="w-7 h-7 text-white ml-1" fill="white" />
        </div>
      </div>
      {title && (
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 p-3">
          <p className="text-white text-xs font-medium">{title}</p>
        </div>
      )}
    </button>
  );
};
