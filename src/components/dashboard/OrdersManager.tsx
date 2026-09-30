'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag, Phone, User, Calendar,
  CheckCircle, Clock, ChevronLeft, RefreshCw, X,
} from 'lucide-react';

interface OrderSummary {
  id: string;
  productTitleSnapshot: string;
  productPriceSnapshot: number;
  firstName: string;
  lastName: string;
  phone: string;
  status: 'NEW' | 'READ';
  readAt: string | null;
  createdAt: string;
}

interface FormField {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
}

interface OrderDetail extends OrderSummary {
  customFields: Record<string, string>;
  formSchemaSnapshot: FormField[];
  teacherNameSnapshot: string;
}

export const OrdersManager: React.FC = () => {
  const [orders, setOrders]         = useState<OrderSummary[]>([]);
  const [newCount, setNewCount]     = useState(0);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError]           = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error('فشل تحميل الطلبات');
      const data = await res.json();
      setOrders(data.orders || []);
      setNewCount(data.newCount || 0);
      setTotal(data.total || 0);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطأ في تحميل الطلبات.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const openOrder = async (orderId: string) => {
    setDetailLoading(true);
    const wasNew = orders.find(o => o.id === orderId)?.status === 'NEW';
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) throw new Error('فشل تحميل تفاصيل الطلب');
      const data = await res.json();
      setSelected(data.order);
      // Update local list status without refetch
      if (wasNew) {
        setOrders(prev =>
          prev.map(o => o.id === orderId ? { ...o, status: 'READ', readAt: new Date().toISOString() } : o)
        );
        setNewCount(prev => Math.max(0, prev - 1));
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطأ.');
    } finally {
      setDetailLoading(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('ar-DZ', {
      timeZone: 'Africa/Algiers',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });

  // ─── Loading / Error states ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-3">
        <RefreshCw className="w-5 h-5 text-teal-400 animate-spin" />
        <span className="text-slate-400 text-sm">جارٍ تحميل الطلبات...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-950/50 border border-rose-800 rounded-xl text-rose-300 text-sm flex items-center gap-2">
        <X className="w-4 h-4 shrink-0" />
        {error}
        <button onClick={fetchOrders} className="mr-auto text-xs underline">إعادة المحاولة</button>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingBag className="w-5 h-5 text-teal-400" />
          <h3 className="text-base font-bold text-white">طلبات المنتجات</h3>
          {newCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-teal-600 text-white text-xs font-bold">
              {newCount} جديد
            </span>
          )}
          <span className="text-xs text-slate-500">({total} إجمالاً)</span>
        </div>
        <button onClick={fetchOrders} className="text-slate-400 hover:text-white transition-colors p-1" title="تحديث">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {orders.length === 0 ? (
        <div className="text-center py-10 space-y-3">
          <ShoppingBag className="w-10 h-10 mx-auto text-slate-700" />
          <p className="text-slate-500 text-sm">لا توجد طلبات بعد.</p>
          <p className="text-slate-600 text-xs">ستظهر الطلبات هنا عندما يقوم الطلاب بالطلب من منتجاتك.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <button
              key={order.id}
              onClick={() => openOrder(order.id)}
              className={`w-full text-right p-4 rounded-xl border transition-all group ${
                order.status === 'NEW'
                  ? 'bg-teal-950/30 border-teal-600/40 hover:border-teal-500/70'
                  : 'bg-slate-900/40 border-slate-700/40 hover:border-slate-600/60'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    order.status === 'NEW' ? 'bg-teal-400' : 'bg-slate-600'
                  }`} />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                      {order.firstName} {order.lastName}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{order.productTitleSnapshot}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-left hidden sm:block">
                    <p className="text-[11px] text-slate-500">{formatDate(order.createdAt)}</p>
                    <p className="text-[11px] text-teal-300 font-mono">{order.phone}</p>
                  </div>
                  {order.status === 'NEW' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-700/50 text-teal-300 font-bold">جديد</span>
                  )}
                  <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Order Detail Modal ────────────────────────────────────────────── */}
      {(selected || detailLoading) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-[#0D1527] border border-[#1E3A5F] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {detailLoading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="w-5 h-5 text-teal-400 animate-spin" />
              </div>
            ) : selected ? (
              <>
                {/* Modal header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-teal-400" />
                      تفاصيل الطلب
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{selected.productTitleSnapshot}</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 space-y-5">
                  {/* Buyer info grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-0.5">
                      <p className="text-[11px] text-slate-500">الاسم الكامل</p>
                      <p className="text-sm font-bold text-white flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        {selected.firstName} {selected.lastName}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[11px] text-slate-500">رقم الهاتف</p>
                      <p className="text-sm font-bold text-teal-300 flex items-center gap-1.5 font-mono">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        {selected.phone}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[11px] text-slate-500">سعر المنتج</p>
                      <p className="text-sm font-bold text-white">
                        {selected.productPriceSnapshot.toLocaleString('ar-DZ')} دج
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[11px] text-slate-500">تاريخ الطلب</p>
                      <p className="text-xs text-slate-300 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        {formatDate(selected.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Custom fields */}
                  {selected.formSchemaSnapshot.length > 0 &&
                    Object.keys(selected.customFields).length > 0 && (
                    <div className="space-y-2.5 pt-3 border-t border-slate-800/70">
                      <p className="text-xs font-bold text-slate-400">المعلومات الإضافية</p>
                      <div className="bg-slate-900/50 rounded-xl p-3 space-y-2">
                        {selected.formSchemaSnapshot.map((field) => {
                          const val = selected.customFields[field.id];
                          if (!val) return null;
                          return (
                            <div key={field.id} className="flex items-start justify-between gap-3">
                              <span className="text-[11px] text-slate-500 shrink-0">{field.label}:</span>
                              <span className="text-[11px] text-white text-left">{val}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Status */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/70">
                    {selected.status === 'READ' || selected.readAt ? (
                      <><CheckCircle className="w-4 h-4 text-teal-400" />
                        <span className="text-xs text-teal-400">تمت القراءة</span></>
                    ) : (
                      <><Clock className="w-4 h-4 text-amber-400" />
                        <span className="text-xs text-amber-400">جديد</span></>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
