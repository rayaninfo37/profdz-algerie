import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold tracking-wide transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-95';

  const variants = {
    primary: 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm hover:shadow-teal-600/20 border border-teal-600',
    secondary: 'bg-burgundy-800 hover:bg-burgundy-900 text-white shadow-sm border border-burgundy-800',
    gold: 'bg-amber-500 hover:bg-amber-600 text-stone-950 font-extrabold shadow-sm border border-amber-400',
    outline: 'border border-slate-700 text-stone-200 hover:bg-slate-800 hover:text-white hover:border-teal-500 shadow-sm',
    ghost: 'text-stone-300 hover:text-teal-400 hover:bg-slate-800',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm',
  };

  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5 font-bold shadow-md',
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          جاري التحميل...
        </>
      ) : (
        children
      )}
    </button>
  );
};
