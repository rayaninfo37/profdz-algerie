'use client';

import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Sparkles } from 'lucide-react';

interface TeacherCountdownProps {
  expiresAt: string | null;
  subscriptionState: string;
}

export function TeacherCountdown({ expiresAt, subscriptionState }: TeacherCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    if (!expiresAt) return;

    const targetTime = new Date(expiresAt).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (subscriptionState === 'FREE_ACTIVE') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-950/60 border border-sky-600/40 text-sky-200 rounded-xl text-xs font-semibold">
        <Clock className="w-3.5 h-3.5 text-sky-400" />
        <span>فترة تجريبية مجانية (30 يوماً استكشافية)</span>
      </div>
    );
  }

  if (timeLeft.isExpired || subscriptionState === 'PRO_EXPIRED') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl text-xs font-bold animate-pulse">
        <AlertTriangle className="w-4 h-4 text-rose-400" />
        <span>انتهت صلاحية باقة PRO — يرجى التجديد لاستعادة الظهور المميز</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-sky-950/60 to-cyan-950/60 border border-sky-500/40 rounded-xl text-xs text-sky-200 shadow-sm">
      <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
      <div className="flex items-center gap-1.5 font-mono font-bold text-white text-sm">
        <span>{timeLeft.days}ي</span> :
        <span>{String(timeLeft.hours).padStart(2, '0')}س</span> :
        <span>{String(timeLeft.minutes).padStart(2, '0')}د</span> :
        <span className="text-cyan-300">{String(timeLeft.seconds).padStart(2, '0')}ث</span>
      </div>
      <span className="text-[11px] text-sky-300 hidden sm:inline">متبقية في باقة PRO النشطة</span>
    </div>
  );
}
