'use client';

import React, { useState } from 'react';
import { Phone, MessageSquare, Send, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import Link from 'next/link';
import {
  getTeacherContactMessage,
  getInstitutionContactMessage,
  formatWhatsAppLink,
  formatTelegramLink,
} from '@/lib/contactMessages';

export interface ProtectedContactButtonsProps {
  targetId?: string;
  targetType?: 'TEACHER' | 'INSTITUTION';
  phone?: string | null;
  whatsapp?: string | null;
  telegram?: string | null;
  teacherName?: string;
  institutionName?: string;
  isAuthenticated: boolean;
}

export const ProtectedContactButtons: React.FC<ProtectedContactButtonsProps> = ({
  targetId,
  targetType = 'TEACHER',
  phone,
  whatsapp,
  telegram,
  teacherName = '',
  institutionName = '',
  isAuthenticated,
}) => {
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const hasPhone = Boolean(phone && phone.trim().length > 0);
  const hasWhatsapp = Boolean(whatsapp && whatsapp.trim().length > 0);
  const hasTelegram = Boolean(telegram && telegram.trim().length > 0);

  if (!hasPhone && !hasWhatsapp && !hasTelegram) {
    return (
      <div className="text-xs text-stone-400 font-sans italic">
        لم يتم إعداد وسائل تواصل عامة حالياً.
      </div>
    );
  }

  const maskPhone = (num: string) => {
    if (num.length < 6) return num;
    return `${num.substring(0, 4)} ** ** **`;
  };

  const recordEvent = (method: 'PHONE' | 'WHATSAPP' | 'TELEGRAM') => {
    if (targetId) {
      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId,
          targetType,
          method,
        }),
      }).catch(() => {});
    }
  };

  const handlePhoneClick = () => {
    if (!isAuthenticated) {
      setLoginModalOpen(true);
      return;
    }
    setPhoneRevealed(true);
    recordEvent('PHONE');
  };

  const handleExternalClick = (url: string, method: 'WHATSAPP' | 'TELEGRAM') => {
    if (!isAuthenticated) {
      setLoginModalOpen(true);
      return;
    }
    recordEvent(method);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Generate contextual messages
  const message =
    targetType === 'INSTITUTION'
      ? getInstitutionContactMessage(institutionName || teacherName)
      : getTeacherContactMessage(teacherName);

  const waLink = hasWhatsapp ? formatWhatsAppLink(whatsapp!, message) : '';
  const tgLink = hasTelegram ? formatTelegramLink(telegram!, message) : '';

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        {/* Protected Phone Button */}
        {hasPhone && (
          <Button
            variant="primary"
            size="lg"
            onClick={handlePhoneClick}
            className="flex-1 md:flex-initial gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold"
          >
            <Phone className="w-4 h-4" />
            {phoneRevealed ? (
              <a href={`tel:${phone}`} className="hover:underline">
                {phone}
              </a>
            ) : (
              <span>{maskPhone(phone!)} (انقر للإظهار)</span>
            )}
          </Button>
        )}

        {/* Protected WhatsApp Button */}
        {hasWhatsapp && (
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleExternalClick(waLink, 'WHATSAPP')}
            className="gap-2 border-slate-700 text-stone-200 hover:bg-slate-800 font-bold"
          >
            <MessageSquare className="w-4 h-4 text-teal-400" /> WhatsApp
          </Button>
        )}

        {/* Protected Telegram Button */}
        {hasTelegram && (
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleExternalClick(tgLink, 'TELEGRAM')}
            className="gap-2 border-slate-700 text-stone-200 hover:bg-slate-800 font-bold"
          >
            <Send className="w-4 h-4 text-teal-400" /> Telegram
          </Button>
        )}
      </div>

      {/* Guest Login Required Modal */}
      <Modal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        title="تسجيل الدخول مطلوب لإظهار بيانات الاتصال"
      >
        <div className="space-y-4 text-stone-200">
          <div className="flex items-center gap-3 p-3 bg-slate-900 border border-teal-500/30 rounded-xl">
            <Lock className="w-6 h-6 text-teal-400 shrink-0" />
            <p className="text-xs text-stone-300 leading-relaxed">
              لحماية خصوصية الأساتذة والمؤسسات والحد من الاتصالات العشوائية، يتطلب فتح قنوات
              الاتصال تسجيل الدخول إلى حسابك.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Link href="/login" className="flex-1">
              <Button variant="primary" size="md" className="w-full bg-teal-600 font-bold">
                تسجيل الدخول
              </Button>
            </Link>
            <Link href="/register" className="flex-1">
              <Button variant="outline" size="md" className="w-full border-slate-700 text-white font-bold">
                إنشاء حساب جديد
              </Button>
            </Link>
          </div>
        </div>
      </Modal>
    </>
  );
};
