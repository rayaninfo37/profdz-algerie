'use client';

import React, { useState, useEffect } from 'react';
import {
  Users, Search, Trash2, RefreshCw, AlertTriangle,
  Lock, Unlock, RotateCcw, Calendar, Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/context/ToastContext';
import { AdminEditTeacherModal } from './AdminEditTeacherModal';

interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  role: string;
  wilaya?: string | null;
  createdAt: string;
  isFrozen: boolean;
  frozenAt?: string | null;
  softDeletedAt?: string | null;
  restorableUntil?: string | null;
  firstLoginAt?: string | null;
  teacherProfile?: {
    id: string;
    isVerified: boolean;
    subscriptionState: string;
    phone?: string | null;
    whatsapp?: string | null;
    telegram?: string | null;
  } | null;
}

interface AdminUsersManagerProps {
  initialFilterStatus?: string;
  initialFilterRole?: string;
}

export const AdminUsersManager: React.FC<AdminUsersManagerProps> = ({
  initialFilterStatus = '',
  initialFilterRole = '',
}) => {
  const toast = useToast();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState(initialFilterRole);
  const [statusFilter, setStatusFilter] = useState(initialFilterStatus);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<UserRecord | null>(null);
  const [confirmFreezeUser, setConfirmFreezeUser] = useState<UserRecord | null>(null);
  const [confirmHardDeleteUser, setConfirmHardDeleteUser] = useState<UserRecord | null>(null);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [subscriptionDaysInput, setSubscriptionDaysInput] = useState<Record<string, string>>({});
  const [showSubInput, setShowSubInput] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);
      params.set('take', '50');
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch {
      toast.error('فشل في جلب المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => { e.preventDefault(); fetchUsers(); };

  const patchAction = async (userId: string, action: string, extra: Record<string, any> = {}) => {
    setActionLoadingId(userId + ':' + action);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId, action, ...extra }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'تمت العملية بنجاح.');
        await fetchUsers();
      } else {
        toast.error(data.error || 'فشلت العملية.');
      }
    } catch {
      toast.error('خطأ في الشبكة.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteConfirmed = async (targetUser: UserRecord) => {
    setActionLoadingId(targetUser.id + ':delete');
    try {
      const res = await fetch(`/api/admin/users?id=${targetUser.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'تم الحذف.');
        setConfirmDeleteUser(null);
        await fetchUsers();
      } else {
        toast.error(data.error || 'فشل الحذف.');
      }
    } catch {
      toast.error('خطأ في الشبكة.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAddDays = async (u: UserRecord) => {
    const days = parseInt(subscriptionDaysInput[u.id] || '0', 10);
    if (!days || days < 1 || days > 365) {
      toast.error('أدخل عدد أيام صحيح (1-365).');
      return;
    }
    await patchAction(u.id, 'UPDATE_SUBSCRIPTION_DAYS', { subscriptionDays: days });
    setShowSubInput(null);
    setSubscriptionDaysInput((prev) => { const n = { ...prev }; delete n[u.id]; return n; });
  };

  const daysUntil = (dateStr?: string | null) => {
    if (!dateStr) return 0;
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="clean-card p-6 bg-[#111D38] border border-[#1E3A5F] rounded-2xl space-y-5 shadow-xl text-stone-100" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-teal-400" />
          إدارة حسابات المنصة ({users.length})
        </h2>
        <Button variant="outline" size="sm" onClick={fetchUsers} className="border-slate-700 text-stone-300 gap-1.5 text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> تحديث
        </Button>
      </div>

      {/* Filter & Search */}
      <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-2 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="البحث بالاسم، البريد، أو الولاية..."
            className="w-full pl-3 pr-9 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-teal-500"
          />
          <Search className="w-4 h-4 text-stone-400 absolute right-3 top-2.5" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500">
          <option value="">جميع الأدوار</option>
          <option value="TEACHER">أساتذة</option>
          <option value="STUDENT">طلاب</option>
          <option value="PARENT">أولياء أمور</option>
          <option value="ADMIN">مدراء</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500">
          <option value="">جميع الحالات</option>
          <option value="PRO_ACTIVE">PRO نشطة</option>
          <option value="FREE_ACTIVE">مجانية نشطة</option>
          <option value="FROZEN">اشتراك مجمد</option>
          <option value="FROZEN_ACCOUNT">حساب مجمد</option>
          <option value="SOFT_DELETED">محذوف مؤقتاً</option>
          <option value="PRO_EXPIRED">PRO منتهية</option>
          <option value="VERIFIED">موثقون</option>
        </select>
      </form>

      {/* Users Table */}
      {loading ? (
        <div className="p-8 text-center text-xs text-stone-400">جاري تحميل الحسابات...</div>
      ) : users.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-stone-400">
                <th className="py-3 px-3">المستخدم</th>
                <th className="py-3 px-3">الدور</th>
                <th className="py-3 px-3">الحالة</th>
                <th className="py-3 px-3">الاشتراك</th>
                <th className="py-3 px-3 text-center min-w-[280px]">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => {
                const isLoading = actionLoadingId?.startsWith(u.id);
                const isSoftDeleted = !!u.softDeletedAt;
                const graceDays = daysUntil(u.restorableUntil);
                const gracePassed = u.restorableUntil && new Date(u.restorableUntil) < new Date();

                return (
                  <tr key={u.id} className={`hover:bg-slate-800/40 transition-colors ${isSoftDeleted ? 'opacity-60' : ''}`}>
                    <td className="py-3 px-3">
                      <div className="font-bold text-white">{u.fullName}</div>
                      <div className="text-[10px] text-stone-400 font-mono">{u.email}</div>
                      {u.firstLoginAt && (
                        <div className="text-[10px] text-teal-500">
                          أول دخول: {new Date(u.firstLoginAt).toLocaleDateString('ar-DZ')}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 border border-slate-700 text-teal-300">
                        {u.role}
                      </span>
                      {u.isFrozen && (
                        <div className="mt-1">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-950 border border-orange-700/40 text-orange-300">مجمد</span>
                        </div>
                      )}
                      {isSoftDeleted && (
                        <div className="mt-1">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-950 border border-rose-700/40 text-rose-300">
                            {gracePassed ? 'قابل للحذف النهائي' : `محذوف (${graceDays} يوم)`}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-stone-300 text-[11px]">
                      {u.wilaya || '—'}
                      <div className="text-[10px] text-stone-500 font-mono">
                        {new Date(u.createdAt).toLocaleDateString('ar-DZ')}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      {u.teacherProfile ? (
                        <div className="space-y-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.teacherProfile.subscriptionState === 'PRO_ACTIVE'
                              ? 'bg-sky-950 text-sky-300 border border-sky-600/40'
                              : u.teacherProfile.subscriptionState === 'FROZEN'
                              ? 'bg-rose-950 text-rose-300 border border-rose-600/40'
                              : 'bg-slate-800 text-stone-300 border border-slate-700'
                          }`}>
                            {u.teacherProfile.subscriptionState}
                          </span>
                          {u.teacherProfile.isVerified && (
                            <Badge variant="teal" size="sm">موثق</Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-stone-500">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {u.role !== 'ADMIN' && (
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          {/* Edit */}
                          <button
                            onClick={() => setEditingUser(u)}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-indigo-950 border border-indigo-700/50 text-indigo-300 hover:bg-indigo-900 flex items-center gap-1"
                          >
                            <Pencil className="w-3 h-3" /> تعديل
                          </button>

                          {/* Freeze / Unfreeze */}
                          {!isSoftDeleted && (
                            u.isFrozen ? (
                              <button
                                onClick={() => patchAction(u.id, 'UNFREEZE')}
                                disabled={!!isLoading}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-teal-950 border border-teal-700/50 text-teal-300 hover:bg-teal-900 disabled:opacity-50 flex items-center gap-1"
                              >
                                <Unlock className="w-3 h-3" /> رفع التجميد
                              </button>
                            ) : (
                              <button
                                onClick={() => setConfirmFreezeUser(u)}
                                disabled={!!isLoading}
                                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-orange-950 border border-orange-700/50 text-orange-300 hover:bg-orange-900 disabled:opacity-50 flex items-center gap-1"
                              >
                                <Lock className="w-3 h-3" /> تجميد
                              </button>
                            )
                          )}

                          {/* Restore */}
                          {isSoftDeleted && (
                            <button
                              onClick={() => patchAction(u.id, 'RESTORE')}
                              disabled={!!isLoading}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-950 border border-emerald-700/50 text-emerald-300 hover:bg-emerald-900 disabled:opacity-50 flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" /> استرجاع
                            </button>
                          )}

                          {/* Subscription Days (teacher only) */}
                          {u.teacherProfile && !isSoftDeleted && (
                            <div className="flex items-center gap-1">
                              {showSubInput === u.id ? (
                                <>
                                  <input
                                    type="number"
                                    min="1"
                                    max="365"
                                    value={subscriptionDaysInput[u.id] || ''}
                                    onChange={(e) => setSubscriptionDaysInput((p) => ({ ...p, [u.id]: e.target.value }))}
                                    placeholder="أيام"
                                    className="w-16 px-1.5 py-1 rounded text-[10px] bg-slate-800 border border-slate-600 text-white"
                                  />
                                  <button
                                    onClick={() => handleAddDays(u)}
                                    disabled={!!isLoading}
                                    className="px-2 py-1 rounded text-[10px] font-bold bg-sky-900 text-sky-200 hover:bg-sky-800 disabled:opacity-50"
                                  >
                                    ✓
                                  </button>
                                  <button onClick={() => setShowSubInput(null)} className="px-1.5 py-1 text-stone-400 text-[10px]">✕</button>
                                </>
                              ) : (
                                <button
                                  onClick={() => setShowSubInput(u.id)}
                                  className="px-2 py-1 rounded-lg text-[10px] font-bold bg-sky-950 border border-sky-700/50 text-sky-300 hover:bg-sky-900 flex items-center gap-1"
                                >
                                  <Calendar className="w-3 h-3" /> إضافة أيام
                                </button>
                              )}
                            </div>
                          )}

                          {/* Delete */}
                          {!isSoftDeleted ? (
                            <button
                              onClick={() => setConfirmDeleteUser(u)}
                              disabled={!!isLoading}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-950 border border-rose-700/50 text-rose-300 hover:bg-rose-900 disabled:opacity-50 flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> حذف
                            </button>
                          ) : gracePassed ? (
                            <button
                              onClick={() => setConfirmHardDeleteUser(u)}
                              disabled={!!isLoading}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-red-900 border border-red-600/50 text-red-200 hover:bg-red-800 disabled:opacity-50 flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> حذف نهائي
                            </button>
                          ) : null}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8 text-center text-xs text-stone-400">لا توجد حسابات تطابق الفلترة الحالية.</div>
      )}

      {/* Confirmation Modal — Soft Delete */}
      {confirmDeleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="clean-card w-full max-w-md p-6 space-y-4 bg-[#111D38] border border-rose-800 text-stone-100 shadow-2xl rounded-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              حذف الحساب
            </h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              سيُحذف حساب <strong className="text-white">{confirmDeleteUser.fullName}</strong> مؤقتاً مع فترة سماح <strong>7 أيام</strong> للاسترجاع. بعدها يصبح قابلاً للحذف النهائي.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm"
                disabled={!!actionLoadingId}
                onClick={() => setConfirmDeleteUser(null)}
                className="border-slate-700 text-stone-300">
                إلغاء
              </Button>
              <Button type="button" variant="primary" size="sm"
                isLoading={actionLoadingId === confirmDeleteUser.id + ':delete'}
                onClick={() => handleDeleteConfirmed(confirmDeleteUser)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold">
                حذف مؤقت (7 أيام)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Edit Teacher Modal */}
      {editingUser && (
        <AdminEditTeacherModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={fetchUsers}
        />
      )}

      {/* Freeze Confirm Modal */}
      {confirmFreezeUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="clean-card w-full max-w-md p-6 space-y-4 bg-[#111D38] border border-orange-800 text-stone-100 shadow-2xl rounded-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Lock className="w-5 h-5 text-orange-400" />
              تجميد الحساب
            </h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              سيُجمَّد حساب <strong className="text-white">{confirmFreezeUser.fullName}</strong> فوراً ولن يتمكن من الدخول للمنصة حتى يتم رفع التجميد يدوياً.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm"
                disabled={!!actionLoadingId}
                onClick={() => setConfirmFreezeUser(null)}
                className="border-slate-700 text-stone-300">
                إلغاء
              </Button>
              <Button type="button" variant="primary" size="sm"
                isLoading={actionLoadingId === confirmFreezeUser.id + ':FREEZE'}
                onClick={() => {
                  patchAction(confirmFreezeUser.id, 'FREEZE');
                  setConfirmFreezeUser(null);
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold">
                تجميد الحساب
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hard Delete Confirm Modal */}
      {confirmHardDeleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="clean-card w-full max-w-md p-6 space-y-4 bg-[#111D38] border border-red-800 text-stone-100 shadow-2xl rounded-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              ⚠️ حذف نهائي — لا يمكن التراجع
            </h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              سيُحذف حساب <strong className="text-white">{confirmHardDeleteUser.fullName}</strong> بشكل نهائي وكامل من قاعدة البيانات. هذا الإجراء <strong className="text-red-400">غير قابل للتراجع</strong> تحت أي ظرف.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm"
                disabled={!!actionLoadingId}
                onClick={() => setConfirmHardDeleteUser(null)}
                className="border-slate-700 text-stone-300">
                إلغاء
              </Button>
              <Button type="button" variant="primary" size="sm"
                isLoading={actionLoadingId === confirmHardDeleteUser.id + ':delete'}
                onClick={() => {
                  handleDeleteConfirmed(confirmHardDeleteUser);
                  setConfirmHardDeleteUser(null);
                }}
                className="bg-red-700 hover:bg-red-800 text-white font-bold">
                حذف نهائي
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>

  );
};
