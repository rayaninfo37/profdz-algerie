'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, MessageSquare, Send, Sparkles, Phone, Users, Star } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import AvatarFallback from '@/components/common/AvatarFallback';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import {
  getProductContactMessage,
  formatWhatsAppLink,
  formatTelegramLink,
} from '@/lib/contactMessages';
import { useLocale } from '@/context/LocaleContext';

export interface ProductCardProps {
  product: {
    id: string;
    title: string;
    slug: string;
    description: string;
    coverImage?: string | null;
    productType: string;
    subject: string;
    educationLevel: string;
    priceDZD: number;
    minPriceDZD?: number | null;
    maxPriceDZD?: number | null;
    isFree: boolean;
    previewContent?: string | null;
    creatorName: string;
    creatorId: string;
    creatorType?: string;
    whatsapp?: string | null;
    telegram?: string | null;
    phone?: string | null;
    contactCount?: number;
    ratingAverage?: number;
    reviewCount?: number;
    assets?: Array<{ id: string; title: string; isFreePreview: boolean }>;
  };
  hasEntitlement?: boolean;
  isDetailView?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  hasEntitlement = false,
  isDetailView = false,
}) => {
  const { t, locale, dir } = useLocale();
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  const hasWhatsapp = Boolean(product.whatsapp && product.whatsapp.trim().length > 0);
  const hasTelegram = Boolean(product.telegram && product.telegram.trim().length > 0);
  const hasPhone = Boolean(product.phone && product.phone.trim().length > 0);

  const message = getProductContactMessage(product.creatorName, product.title);
  const waLink = hasWhatsapp ? formatWhatsAppLink(product.whatsapp!, message) : '';
  const tgLink = hasTelegram ? formatTelegramLink(product.telegram!, message) : '';

  const renderPriceBadge = () => {
    if (product.isFree) return 'مجاني (متاح للتحميل)';
    if (product.minPriceDZD && product.maxPriceDZD && product.minPriceDZD !== product.maxPriceDZD) {
      return `${product.minPriceDZD.toLocaleString()} — ${product.maxPriceDZD.toLocaleString()} دج`;
    }
    if (product.minPriceDZD && !product.maxPriceDZD) {
      return `ابتداءً من ${product.minPriceDZD.toLocaleString()} دج`;
    }
    if (product.priceDZD && product.priceDZD > 0) {
      return `${product.priceDZD.toLocaleString()} دج`;
    }
    return 'السعر عند التواصل';
  };

  const recordEvent = (method: 'WHATSAPP' | 'TELEGRAM' | 'PHONE') => {
    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetId: product.creatorId,
        targetType: product.creatorType || 'TEACHER',
        productId: product.id,
        method,
      }),
    }).catch(() => {});

    fetch('/api/products/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: product.id,
        message: `تواصل مباشر عبر ${method}: ${message}`,
      }),
    }).catch(() => {});
  };

  const handleExternalClick = (url: string, method: 'WHATSAPP' | 'TELEGRAM') => {
    recordEvent(method);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (isDetailView) {
    return (
      <>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="lg"
            onClick={() => setContactModalOpen(true)}
            className="gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold shadow-lg shadow-cyan-500/25 border-0"
          >
            <MessageSquare className="w-5 h-5" /> تواصل مع الأستاذ الآن
          </Button>
        </div>

        {/* Free Sample Preview Modal */}
        <Modal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          title={`معاينة مجانية: ${product.title}`}
        >
          <div className="space-y-4 text-slate-100">
            <div className="p-4 bg-[#081223] border border-cyan-500/30 rounded-xl space-y-2">
              <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" /> عينة التذوق المجانية (Taste Before Connecting)
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {product.previewContent || 'تتضمن العينة مقتطفات من الدروس والتمارين النموذجية المحلولة.'}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                السعر المقدر:{' '}
                <strong className="text-white">
                  {product.isFree ? 'مجاني' : `${product.priceDZD} DZD`}
                </strong>
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setPreviewModalOpen(false);
                  setContactModalOpen(true);
                }}
                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold"
              >
                تواصل للاستفسار عن المنتج
              </Button>
            </div>
          </div>
        </Modal>

        {/* Product Contact Modal */}
        <Modal
          isOpen={contactModalOpen}
          onClose={() => setContactModalOpen(false)}
          title={`${t.discovery.contact} ${product.creatorName} — ${product.title}`}
        >
          <div className="space-y-4 text-slate-200">
            <p className="text-xs text-slate-400 leading-relaxed">
              اختر وسيلة التواصل لفتح محادثة مباشرة مع الأستاذ ({product.creatorName}) حول هذا المنتج:
            </p>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-white/10 text-xs text-cyan-300 space-y-1">
              <span className="font-bold text-white block">نص الرسالة التلقائي:</span>
              <span className="text-slate-400 italic">«{message}»</span>
            </div>

            <div className="space-y-2.5 pt-2">
              {hasWhatsapp && (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => handleExternalClick(waLink, 'WHATSAPP')}
                  className="w-full justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  <MessageSquare className="w-5 h-5" /> تواصل عبر WhatsApp
                </Button>
              )}

              {hasTelegram && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleExternalClick(tgLink, 'TELEGRAM')}
                  className="w-full justify-center gap-2 border-sky-500/40 text-sky-300 hover:bg-sky-500/10 font-bold"
                >
                  <Send className="w-5 h-5" /> تواصل عبر Telegram
                </Button>
              )}
            </div>
          </div>
        </Modal>
      </>
    );
  }

  return (
    <>
      <div className="group bg-[#0A1628]/80 border border-cyan-500/20 hover:border-cyan-500/50 rounded-2xl overflow-hidden flex flex-col justify-between text-slate-100 shadow-xl backdrop-blur-xl hover:shadow-cyan-500/10 hover:-translate-y-0.5 transition-all duration-300">
        <div>
          {/* Publication Cover Presentation */}
          <div className="relative h-48 w-full bg-slate-900 overflow-hidden border-b border-white/5">
            <AvatarFallback
              src={product.coverImage}
              name={product.title}
              size={240}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628] via-transparent to-transparent opacity-80" />
            <div className="absolute top-3 left-3">
              <span className="text-[11px] font-bold px-3 py-1 rounded-lg uppercase tracking-wider bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-cyan-500/20">
                {renderPriceBadge()}
              </span>
            </div>
            {(product.isFree || (product.previewContent && product.previewContent.trim().length > 0) || (product.assets && product.assets.some(a => a.isFreePreview))) && (
              <div className="absolute top-3 right-3">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-400/30 text-amber-300 shadow-xs flex items-center gap-1.5 backdrop-blur-md">
                  <Sparkles className="w-3 h-3 text-amber-400" /> معاينة مجانية
                </span>
              </div>
            )}
          </div>

          {/* Publication Meta & Narrative */}
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-cyan-950/40 border border-cyan-500/20 text-cyan-300">
                {product.subject}
              </span>
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-slate-800/80 border border-white/5 text-slate-300">
                {product.educationLevel}
              </span>
            </div>

            <Link href={`/products/${product.slug}`} prefetch={true} className="hover:underline block">
              <h3 className="text-base font-bold text-white line-clamp-2 leading-snug tracking-tight group-hover:text-cyan-300 transition-colors">
                {product.title}
              </h3>
            </Link>

            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {product.description}
            </p>

            {/* Rating display */}
            <div className="flex items-center gap-1.5 text-xs">
              <div className="flex items-center gap-0.5 text-amber-400">
                <Star className={`w-3.5 h-3.5 ${(product.ratingAverage || 0) > 0 ? 'fill-amber-400' : 'text-slate-600'}`} />
                <span className="font-bold font-mono text-[11px] text-amber-300">
                  {(product.ratingAverage || 0) > 0 ? product.ratingAverage!.toFixed(1) : '—'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500">
                ({product.reviewCount || 0} تقييم)
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
              <span className="text-cyan-300 font-semibold">{t.product.by} {product.creatorName}</span>
              {typeof product.contactCount === 'number' && product.contactCount > 0 && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                  <Users className="w-3.5 h-3.5 text-cyan-400" /> {product.contactCount} {t.product.inquiries}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action CTA */}
        <div className="p-5 pt-0">
          <Link href={`/products/${product.slug}`} prefetch={true} className="w-full block">
            <Button
              variant="primary"
              size="sm"
              className="w-full h-9 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold text-xs gap-2 rounded-xl shadow-md shadow-cyan-500/20 transition-all border-0"
            >
              <Eye className="w-3.5 h-3.5" /> {t.product.exploreMore}
            </Button>
          </Link>
        </div>
      </div>

      {/* Free Sample Preview Modal */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title={`${t.product.freePreview}: ${product.title}`}
      >
        <div className="space-y-4 text-slate-200">
          <div className="p-4 bg-cyan-950/30 border border-cyan-500/20 rounded-xl space-y-2">
            <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" /> {t.product.tasteSample}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
              {product.previewContent || '...'}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">
              {t.product.fullPrice}{' '}
              <strong className="text-white">
                {product.isFree ? t.common.free : `${product.priceDZD} DZD`}
              </strong>
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setPreviewModalOpen(false);
                setContactModalOpen(true);
              }}
              className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold"
            >
              {t.product.contactSeller}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Product Contact Modal */}
      <Modal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        title={`${t.discovery.contact} ${product.creatorName} — ${product.title}`}
      >
        <div className="space-y-4 text-slate-200">
          <p className="text-xs text-slate-400 leading-relaxed">
            اختر وسيلة التواصل لفتح محادثة مباشرة مع الأستاذ ({product.creatorName}) حول هذا المنتج:
          </p>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-white/10 text-xs text-cyan-300 font-sans space-y-1">
            <span className="font-bold text-white block">نص الرسالة التلقائي:</span>
            <span className="text-slate-400 italic">«{message}»</span>
          </div>

          <div className="space-y-2.5 pt-2">
            {hasWhatsapp && (
              <Button
                variant="primary"
                size="lg"
                onClick={() => handleExternalClick(waLink, 'WHATSAPP')}
                className="w-full justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                <MessageSquare className="w-5 h-5" /> تواصل عبر WhatsApp
              </Button>
            )}

            {hasTelegram && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleExternalClick(tgLink, 'TELEGRAM')}
                className="w-full justify-center gap-2 border-sky-500/40 text-sky-300 hover:bg-sky-500/10 font-bold"
              >
                <Send className="w-5 h-5" /> تواصل عبر Telegram
              </Button>
            )}

            {!hasWhatsapp && !hasTelegram && (
              <div className="p-4 text-center bg-slate-900/60 rounded-xl border border-white/10 text-xs text-slate-400">
                لم يقم الأستاذ بإعداد WhatsApp أو Telegram بعد. يمكنك زيارة ملفه الشخصي للاطلاع على الهاتف.
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};