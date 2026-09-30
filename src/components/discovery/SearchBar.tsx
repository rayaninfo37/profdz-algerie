'use client';

import React, { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, MapPin, BookOpen, GraduationCap, Filter, RotateCcw, DollarSign, Star } from 'lucide-react';
import { SUBJECTS, EDUCATION_LEVELS, WILAYAS, TEACHING_MODES } from '@/lib/taxonomy';
import { Button } from '@/components/ui/Button';
import { useLocale } from '@/context/LocaleContext';

export interface SearchFilters {
  q?: string;
  subject?: string;
  level?: string;
  wilaya?: string;
  mode?: string;
  minPrice?: string;
  maxPrice?: string;
}

export interface SearchBarProps {
  initialFilters?: SearchFilters;
  onChange?: (filters: SearchFilters) => void;
  onReset?: () => void;
  targetPath?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  initialFilters,
  onChange,
  onReset,
  targetPath,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t, locale, dir } = useLocale();

  const currentPath = targetPath || pathname;

  const urlFilters: SearchFilters = {
    q: initialFilters?.q ?? searchParams.get('q') ?? '',
    subject: initialFilters?.subject ?? searchParams.get('subject') ?? '',
    level: initialFilters?.level ?? searchParams.get('level') ?? '',
    wilaya: initialFilters?.wilaya ?? searchParams.get('wilaya') ?? '',
    mode: initialFilters?.mode ?? searchParams.get('mode') ?? '',
    minPrice: initialFilters?.minPrice ?? searchParams.get('minPrice') ?? '',
    maxPrice: initialFilters?.maxPrice ?? searchParams.get('maxPrice') ?? '',
  };

  const [searchQuery, setSearchQuery] = useState(urlFilters.q || '');

  // Keep local search input synced if URL param changes externally
  React.useEffect(() => {
    setSearchQuery(urlFilters.q || '');
  }, [urlFilters.q]);

  const updateUrlFilters = (newFilters: SearchFilters) => {
    const params = new URLSearchParams();
    if (newFilters.q) params.set('q', newFilters.q);
    if (newFilters.subject) params.set('subject', newFilters.subject);
    if (newFilters.level) params.set('level', newFilters.level);
    if (newFilters.wilaya) params.set('wilaya', newFilters.wilaya);
    if (newFilters.mode) params.set('mode', newFilters.mode);
    if (newFilters.minPrice) params.set('minPrice', newFilters.minPrice);
    if (newFilters.maxPrice) params.set('maxPrice', newFilters.maxPrice);

    const queryString = params.toString();
    const target = queryString ? `${currentPath}?${queryString}` : currentPath;
    router.push(target, { scroll: false });
  };

  // Debounce text search query updates
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== (urlFilters.q || '')) {
        const newFilters = { ...urlFilters, q: searchQuery };
        if (onChange) {
          onChange(newFilters);
        } else {
          updateUrlFilters(newFilters);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, urlFilters.q]);

  const handleInputChange = (field: keyof SearchFilters, value: string) => {
    if (field === 'q') {
      setSearchQuery(value);
      return;
    }

    const newFilters = { ...urlFilters, q: searchQuery, [field]: value };
    if (onChange) {
      onChange(newFilters);
    } else {
      updateUrlFilters(newFilters);
    }
  };

  const activeFiltersCount = [
    searchQuery,
    urlFilters.subject,
    urlFilters.level,
    urlFilters.wilaya,
    urlFilters.mode,
    urlFilters.minPrice,
    urlFilters.maxPrice,
  ].filter(Boolean).length;

  const handleReset = () => {
    setSearchQuery('');
    const resetFilters = { q: '', subject: '', level: '', wilaya: '', mode: '', minPrice: '', maxPrice: '' };
    updateUrlFilters(resetFilters);
    if (onReset) onReset();
  };

  return (
    <div className="w-full bg-[#0A1628]/80 border border-cyan-500/20 rounded-2xl p-6 md:p-7 space-y-5 text-slate-100 shadow-xl backdrop-blur-xl transition-all">
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <Search className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} w-5 h-5 text-cyan-400 pointer-events-none`} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleInputChange('q', e.target.value)}
          placeholder={t.common.searchPlaceholder}
          className={`w-full ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3.5 bg-slate-900/90 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:bg-slate-900 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-inner`}
        />
        {activeFiltersCount > 0 && (
          <button
            onClick={handleReset}
            className={`absolute ${dir === 'rtl' ? 'left-3' : 'right-3'} px-3 py-1.5 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-xs rounded-lg flex items-center gap-1.5 font-bold transition-all shadow-xs`}
          >
            <RotateCcw className="w-3.5 h-3.5" /> {t.discovery.resetFilters} ({activeFiltersCount})
          </button>
        )}
      </div>

      {/* Structured Filters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Subject Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-cyan-300 flex items-center gap-1 uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" /> {t.discovery.subjectLabel}
          </label>
          <select
            value={urlFilters.subject || ''}
            onChange={(e) => handleInputChange('subject', e.target.value)}
            className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 focus:bg-slate-900 font-medium cursor-pointer transition-colors"
          >
            <option value="">{t.common.allSubjects}</option>
            {SUBJECTS.map((s) => (
              <option key={s.id} value={s.name} className="bg-slate-900 text-white">
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Education Level Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-cyan-300 flex items-center gap-1 uppercase tracking-wider">
            <GraduationCap className="w-3.5 h-3.5 text-cyan-400" /> {t.discovery.levelLabel}
          </label>
          <select
            value={urlFilters.level || ''}
            onChange={(e) => handleInputChange('level', e.target.value)}
            className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 focus:bg-slate-900 font-medium cursor-pointer transition-colors"
          >
            <option value="">{t.common.allLevels}</option>
            {EDUCATION_LEVELS.map((l) => (
              <option key={l.id} value={l.label} className="bg-slate-900 text-white">
                {l.label}
              </option>
            ))}
          </select>
        </div>

        {/* 58 Wilayas Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-cyan-300 flex items-center gap-1 uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" /> {t.discovery.wilayaLabel}
          </label>
          <select
            value={urlFilters.wilaya || ''}
            onChange={(e) => handleInputChange('wilaya', e.target.value)}
            className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 focus:bg-slate-900 font-medium cursor-pointer transition-colors"
          >
            <option value="">{t.common.allWilayas}</option>
            {WILAYAS.map((w) => (
              <option key={w.code} value={w.name} className="bg-slate-900 text-white">
                {w.code} - {w.name}
              </option>
            ))}
          </select>
        </div>

        {/* Mode Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-cyan-300 flex items-center gap-1 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-cyan-400" /> {t.discovery.modeLabel}
          </label>
          <select
            value={urlFilters.mode || ''}
            onChange={(e) => handleInputChange('mode', e.target.value)}
            className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 focus:bg-slate-900 font-medium cursor-pointer transition-colors"
          >
            <option value="">{t.discovery.allModes}</option>
            {TEACHING_MODES.map((m) => (
              <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Price Range Filters Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-white/10">
        {/* Min Price DZD */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-amber-400 flex items-center gap-1 uppercase tracking-wider">
            <DollarSign className="w-3.5 h-3.5 text-amber-400" /> السعر الأدنى (DZD)
          </label>
          <input
            type="number"
            value={urlFilters.minPrice || ''}
            onChange={(e) => handleInputChange('minPrice', e.target.value)}
            placeholder="مثال: 1000 DZD"
            className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 focus:bg-slate-900 font-semibold"
          />
        </div>

        {/* Max Price DZD */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-amber-400 flex items-center gap-1 uppercase tracking-wider">
            <DollarSign className="w-3.5 h-3.5 text-amber-400" /> السعر الأقصى (DZD)
          </label>
          <input
            type="number"
            value={urlFilters.maxPrice || ''}
            onChange={(e) => handleInputChange('maxPrice', e.target.value)}
            placeholder="مثال: 3000 DZD"
            className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 focus:bg-slate-900 font-semibold"
          />
        </div>
      </div>
    </div>
  );
};
