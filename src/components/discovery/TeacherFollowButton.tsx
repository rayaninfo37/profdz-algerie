'use client';

import React, { useState } from 'react';
import { UserPlus, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface TeacherFollowButtonProps {
  followingUserId: string;
  initialIsFollowing?: boolean;
}

export const TeacherFollowButton: React.FC<TeacherFollowButtonProps> = ({
  followingUserId,
  initialIsFollowing = false,
}) => {
  const [following, setFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followingId: followingUserId }),
      });
      const data = await res.json();
      if (data.success) {
        setFollowing(data.following);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={following ? 'outline' : 'secondary'}
      size="lg"
      onClick={handleFollow}
      isLoading={loading}
      className="gap-2 font-bold"
    >
      {following ? (
        <>
          <Check className="w-4 h-4 text-teal-600" /> مُتابع (Following)
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 text-teal-600" /> متابعةالأستاذ (Follow)
        </>
      )}
    </Button>
  );
};
