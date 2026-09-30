'use client';

import React, { createContext, useContext } from 'react';
import { dictionaries, Translations } from '@/lib/i18n/dictionaries';

interface LocaleContextType {
  locale: 'ar';
  t: Translations;
  dir: 'rtl';
  setLocale: (loc: any) => void;
}

const LocaleContext = createContext<LocaleContextType>({
  locale: 'ar',
  t: dictionaries.ar,
  dir: 'rtl',
  setLocale: () => {},
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const value: LocaleContextType = {
    locale: 'ar',
    t: dictionaries.ar,
    dir: 'rtl',
    setLocale: () => {},
  };

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  return context || {
    locale: 'ar' as const,
    t: dictionaries.ar,
    dir: 'rtl' as const,
    setLocale: () => {},
  };
}

