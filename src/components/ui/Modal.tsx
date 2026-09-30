import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#111D38] border border-[#1E3A5F] rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 text-stone-100 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          {title && (
            <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shadow-glow-teal" />
              {title}
            </h3>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};
