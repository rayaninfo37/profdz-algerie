'use client';

import React, { useState, useRef } from 'react';
import { Camera, Upload, Check, AlertCircle, RefreshCw } from 'lucide-react';
import AvatarFallback from '@/components/common/AvatarFallback';
import { Button } from '@/components/ui/Button';

export interface ProfileImageUploaderProps {
  currentAvatarUrl?: string | null;
  name: string;
  onUploadSuccess?: (newUrl: string) => void;
  size?: number;
}

export const ProfileImageUploader: React.FC<ProfileImageUploaderProps> = ({
  currentAvatarUrl,
  name,
  onUploadSuccess,
  size = 80,
}) => {
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      setError('يرجى اختيار ملف صورة صالح (JPEG, PNG, WebP, GIF)');
      return;
    }

    // Validate size (1 MB for students, 2 MB for other roles)
    const maxSizeBytes = 1 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError('حجم الصورة يجب ألا يتجاوز 1 ميغابايت');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setAvatarUrl(data.url);
        // Save to user profile
        await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarUrl: data.url }),
        });

        setSuccess(true);
        if (onUploadSuccess) onUploadSuccess(data.url);
      } else {
        setError(data.error || 'فشل في رفع الصورة');
      }
    } catch {
      setError('حدث خطأ أثناء رفع الصورة');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative group">
        <AvatarFallback
          src={avatarUrl}
          name={name}
          size={size}
          className="rounded-2xl object-cover border-2 border-teal-500 shadow-md"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="absolute inset-0 bg-slate-950/60 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
          title="تغيير الصورة الشخصية"
        >
          {isUploading ? (
            <RefreshCw className="w-6 h-6 animate-spin text-teal-400" />
          ) : (
            <Camera className="w-6 h-6 text-white" />
          )}
        </button>
      </div>

      <div className="space-y-1 text-xs">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          isLoading={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="border-slate-700 text-stone-200 hover:bg-slate-800 gap-1.5 font-bold"
        >
          <Upload className="w-3.5 h-3.5 text-teal-400" />
          {avatarUrl ? 'تغيير الصورة' : 'رفع صورة شخصية'}
        </Button>
        <span className="text-[10px] text-stone-400 block">PNG, JPG, WebP حتى 1 ميغابايت</span>
        {success && <span className="text-[10px] text-teal-400 font-bold block flex items-center gap-1"><Check className="w-3 h-3" /> تم حفظ الصورة!</span>}
        {error && <span className="text-[10px] text-rose-400 font-bold block flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</span>}
      </div>
    </div>
  );
};
