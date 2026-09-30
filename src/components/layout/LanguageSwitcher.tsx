'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { useLocale } from '@/context/LocaleContext';
import { Locale } from '@/lib/i18n/dictionaries';

export const LanguageSwitcher = () => {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages: { code: Locale; label: string; flag: string }[] = [
    { code: 'ar', label: 'العربية (DZ)', flag: '🇩🇿' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = languages.find((l) => l.code === locale) || languages[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/80 hover:border-teal-500/50 text-xs font-semibold text-stone-200 hover:text-white transition-all shadow-inner"
        title="تغيير اللغة / Changer de langue / Change language"
      >
        <Globe className="w-3.5 h-3.5 text-teal-400" />
        <span className="text-xs">{currentLang.flag}</span>
        <span className="hidden sm:inline-block text-[11px] uppercase tracking-wider font-bold">
          {currentLang.code}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-36 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl py-1 z-50 animate-fadeIn">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLocale(lang.code);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs text-right transition-colors ${
                locale === lang.code
                  ? 'bg-teal-950/60 text-teal-300 font-bold'
                  : 'text-stone-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </div>
              {locale === lang.code && <Check className="w-3.5 h-3.5 text-teal-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
