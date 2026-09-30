'use client';

import React, { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { YouTubePlayer } from '@/components/ui/YouTubePlayer';
import { PurchaseFormModal } from '@/components/products/PurchaseFormModal';

interface ProductPageClientProps {
  product: {
    id: string;
    title: string;
    priceDZD: number;
    isFree: boolean;
    youtubeUrl?: string | null;
    purchaseFormSchema?: string | null;
  };
  teacherActive: boolean;
}

export const ProductPageClient: React.FC<ProductPageClientProps> = ({ product, teacherActive }) => {
  const [purchaseOpen, setPurchaseOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* YouTube Video Player */}
      {product.youtubeUrl && (
        <div className="clean-card p-6 bg-[#0A1628]/90 border border-cyan-500/25 shadow-xl backdrop-blur-xl rounded-3xl space-y-3">
          <h3 className="text-base font-bold text-white">معاينة الفيديو التعليمي</h3>
          <YouTubePlayer videoId={product.youtubeUrl} title={product.title} />
        </div>
      )}

      {/* Purchase Button */}
      {teacherActive && (
        <div className="clean-card p-5 bg-[#0A1628]/90 border border-teal-500/30 shadow-xl backdrop-blur-xl rounded-2xl flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-stone-400">السعر</p>
            <p className="text-xl font-black text-white">
              {product.isFree ? (
                <span className="text-teal-400">مجاني</span>
              ) : (
                `${product.priceDZD.toLocaleString('ar-DZ')} دج`
              )}
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => setPurchaseOpen(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white font-black gap-2 shadow-lg"
          >
            <ShoppingCart className="w-5 h-5" />
            {product.isFree ? 'احصل عليه مجاناً' : 'اطلب الآن'}
          </Button>
        </div>
      )}

      {!teacherActive && (
        <div className="p-4 bg-slate-900/70 border border-slate-700 rounded-2xl text-center text-sm text-stone-400">
          هذا المنتج غير متاح حالياً للطلب.
        </div>
      )}

      {/* Purchase Form Modal */}
      <PurchaseFormModal
        isOpen={purchaseOpen}
        onClose={() => setPurchaseOpen(false)}
        productId={product.id}
        productTitle={product.title}
        priceDZD={product.priceDZD}
        isFree={product.isFree}
        purchaseFormSchema={product.purchaseFormSchema || undefined}
      />
    </div>
  );
};
