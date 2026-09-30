'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
  };
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, type, message, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toast = {
    success: (msg: string, d?: number) => addToast('success', msg, d),
    error: (msg: string, d?: number) => addToast('error', msg, d),
    warning: (msg: string, d?: number) => addToast('warning', msg, d),
    info: (msg: string, d?: number) => addToast('info', msg, d),
  };

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-5 left-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
        dir="rtl"
      >
        {toasts.map((t) => {
          const typeStyles = {
            success: 'bg-emerald-950/95 border-emerald-500/50 text-emerald-100 shadow-emerald-950/40',
            error: 'bg-rose-950/95 border-rose-500/50 text-rose-100 shadow-rose-950/40',
            warning: 'bg-amber-950/95 border-amber-500/50 text-amber-100 shadow-amber-950/40',
            info: 'bg-teal-950/95 border-teal-500/50 text-teal-100 shadow-teal-950/40',
          }[t.type];

          const Icon = {
            success: CheckCircle2,
            error: AlertCircle,
            warning: AlertTriangle,
            info: Info,
          }[t.type];

          const iconColor = {
            success: 'text-emerald-400',
            error: 'text-rose-400',
            warning: 'text-amber-400',
            info: 'text-teal-400',
          }[t.type];

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-xl backdrop-blur-md transition-all animate-fadeIn ${typeStyles}`}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
              <div className="flex-1 text-xs font-semibold leading-relaxed">{t.message}</div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-stone-400 hover:text-white transition-colors shrink-0 p-0.5"
                aria-label="إغلاق التنبيه"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType['toast'] => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
};
