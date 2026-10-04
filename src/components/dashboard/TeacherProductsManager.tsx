'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Plus, Edit3, Trash2, Eye, EyeOff, ExternalLink, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/context/ToastContext';
import { EditProductModal, EditableProduct } from './EditProductModal';
import { CreateProductModal } from './CreateProductModal';

export interface TeacherProductsManagerProps {
  initialProducts: EditableProduct[];
  teacherId: string;
}

export const TeacherProductsManager: React.FC<TeacherProductsManagerProps> = ({
  initialProducts,
  teacherId,
}) => {
  const router = useRouter();
  const toast = useToast();
  const [products, setProducts] = useState<EditableProduct[]>(initialProducts || []);
  const [editingProduct, setEditingProduct] = useState<EditableProduct | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleProductCreated = () => {
    router.refresh();
    // Re-fetch products locally to show immediately
    fetch(`/api/products?creatorId=${teacherId}&take=50`)
      .then((r) => r.json())
      .then((data) => {
        if (data.products) setProducts(data.products);
      })
      .catch(() => {});
  };

  const handleProductUpdated = (updated: EditableProduct) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
    router.refresh();
  };

  const handleProductDeleted = (deletedId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== deletedId));
    router.refresh();
  };

  const handleTogglePublish = async (prod: EditableProduct) => {
    const nextState = !prod.isPublished;
    setTogglingId(prod.id);

    try {
      const res = await fetch(`/api/products/${prod.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: nextState }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(nextState ? 'تم نشر المنتج في المتجر بنجاح!' : 'تم تحويل المنتج إلى مسودة مخفية.');
        setProducts((prev) =>
          prev.map((p) => (p.id === prod.id ? { ...p, isPublished: nextState } : p))
        );
        router.refresh();
      } else {
        toast.error(data.error || 'فشل في تغيير حالة النشر.');
      }
    } catch {
      toast.error('حدث خطأ في الاتصال بالخادم.');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="clean-card p-6 bg-[#111D38] border border-[#1E3A5F] rounded-2xl space-y-6 text-stone-100 shadow-xl" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-400" />
            <h3 className="text-lg font-black text-white">إدارة كتالوج المنتجات والموارد الرقمية ({products.length})</h3>
          </div>
          <p className="text-xs text-stone-400">
            يمكنك هنا تعديل تفاصيل أي كتاب أو مورد تعليمي، تغيير سعره، نشره أو إخفاؤه، وحذفه في أي وقت.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setCreateModalOpen(true)}
          className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold shrink-0 shadow-md"
        >
          <Plus className="w-4 h-4" /> إضافة مورد جديد
        </Button>
      </div>

      {/* Product List */}
      {products.length === 0 ? (
        <div className="p-10 text-center bg-[#0D1527] rounded-xl border border-slate-800 space-y-3">
          <BookOpen className="w-10 h-10 text-stone-600 mx-auto" />
          <h4 className="text-sm font-bold text-white">لم تقم بإضافة أي موارد أو كتب رقمية بعد</h4>
          <p className="text-xs text-stone-400 max-w-md mx-auto">
            انشر ملخصاتك، سلاسل التمارين المحلولة، أو كتبك التعليمية لتبدأ في استقبال طلبات واستفسارات الطلاب وأولياء الأمور.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="border-teal-600/50 text-teal-400 hover:bg-teal-950 font-bold gap-1.5 mt-2"
          >
            <Plus className="w-4 h-4" /> أضف أول مورد تعليمي
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((prod) => (
            <div
              key={prod.id}
              className="p-4 bg-[#0D1527] rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                {/* Cover thumbnail */}
                <div className="w-16 h-20 rounded-lg overflow-hidden bg-slate-900 border border-slate-700 shrink-0 relative">
                  <img
                    src={prod.coverImage || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=200&auto=format&fit=crop&q=80'}
                    alt={prod.title}
                    className="w-full h-full object-cover"
                  />
                  {prod.isFree && (
                    <span className="absolute bottom-0 inset-x-0 bg-teal-600 text-white text-[9px] font-bold text-center py-0.5">
                      مجاني
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        prod.isPublished
                          ? 'bg-teal-950 text-teal-300 border border-teal-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {prod.isPublished ? 'منشور في المتجر' : 'مسودة مخفية'}
                    </span>
                    <span className="text-[10px] text-stone-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {prod.subject}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white truncate" title={prod.title}>
                    {prod.title}
                  </h4>

                  <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">
                    {prod.description}
                  </p>

                  <div className="pt-1 text-xs font-bold text-teal-400 font-mono">
                    {prod.isFree ? '0 دج (مجاني)' : `${prod.priceDZD?.toLocaleString('ar-DZ') || 0} دج`}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingProduct(prod)}
                    className="border-slate-700 text-stone-200 hover:bg-slate-800 hover:text-white gap-1.5 text-xs h-8 px-2.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-teal-400" />
                    تعديل
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={togglingId === prod.id}
                    onClick={() => handleTogglePublish(prod)}
                    className={`gap-1.5 text-xs h-8 px-2.5 border ${
                      prod.isPublished
                        ? 'border-amber-900/60 text-amber-300 hover:bg-amber-950/40'
                        : 'border-teal-900/60 text-teal-300 hover:bg-teal-950/40'
                    }`}
                  >
                    {prod.isPublished ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        إخفاء
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        نشر
                      </>
                    )}
                  </Button>
                </div>

                {prod.slug && (
                  <Link
                    href={`/products/${prod.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-bold px-2 py-1 rounded hover:bg-slate-900 transition-colors"
                  >
                    <span>صفحة المورد</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <EditProductModal
          isOpen={Boolean(editingProduct)}
          onClose={() => setEditingProduct(null)}
          product={editingProduct}
          onSuccess={handleProductUpdated}
          onDelete={handleProductDeleted}
        />
      )}

      {/* Create Product Modal */}
      <CreateProductModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleProductCreated}
      />
    </div>
  );
};
