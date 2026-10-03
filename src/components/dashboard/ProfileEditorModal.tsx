'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ProfileImageUploader } from '@/components/common/ProfileImageUploader';
import { SecuritySettings } from '@/components/dashboard/SecuritySettings';
import { SUBJECTS, EDUCATION_LEVELS, WILAYAS, TEACHING_MODES } from '@/lib/taxonomy';
import { User as UserIcon, Award, Save, Plus, Trash2, Shield, Briefcase, MapPin } from 'lucide-react';
import { validateAlgerianPhone } from '@/lib/algerianPhone';

export interface ProfileEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id?: string;
    fullName: string;
    avatarUrl?: string | null;
    wilaya?: string | null;
    role: string;
    phone?: string | null;
    teacherProfile?: any;
    studentProfile?: any;
    parentProfile?: any;
    institutionProfile?: any;
  };
  onProfileUpdated?: () => void;
}

export const ProfileEditorModal: React.FC<ProfileEditorModalProps> = ({
  isOpen,
  onClose,
  user,
  onProfileUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'teaching' | 'security'>('profile');
  const [fullName, setFullName] = useState(user.fullName || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [wilaya, setWilaya] = useState(user.wilaya || 'الجزائر العاصمة (Algiers)');

  // Teacher specific
  const [headline, setHeadline] = useState(user.teacherProfile?.headline || '');
  const [bio, setBio] = useState(user.teacherProfile?.bio || '');
  const [experienceYears, setExperienceYears] = useState(
    String(user.teacherProfile?.experienceYears || '0')
  );

  const [qualificationsList, setQualificationsList] = useState<string[]>([]);
  const [newQualification, setNewQualification] = useState('');
  const [pricingInfo, setPricingInfo] = useState(user.teacherProfile?.pricingInfo || '');
  const [priceMin, setPriceMin] = useState<string>('');
  const [priceMax, setPriceMax] = useState<string>('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [teachingMode, setTeachingMode] = useState('BOTH');
  const [whatsapp, setWhatsapp] = useState('');
  const [telegram, setTelegram] = useState('');
  const [website, setWebsite] = useState('');
  const [storeLocation, setStoreLocation] = useState('');

  // Student specific
  const [educationLevel, setEducationLevel] = useState('BAC Prep (البكالوريا)');

  // Parent specific
  const [budgetRange, setBudgetRange] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Reset and synchronize state whenever user or isOpen changes
  useEffect(() => {
    if (!isOpen) return;

    setFullName(user.fullName || '');
    setAvatarUrl(user.avatarUrl || '');
    setWilaya(user.wilaya || 'الجزائر العاصمة (Algiers)');

    if (user.role === 'TEACHER') {
      const tp = user.teacherProfile || {};
      setHeadline(tp.headline || '');
      setBio(tp.bio || '');
      setExperienceYears(String(tp.experienceYears || '0'));
      setPricingInfo(tp.pricingInfo || '');
      setPriceMin(tp.priceMin !== undefined && tp.priceMin !== null ? String(tp.priceMin) : '');
      setPriceMax(tp.priceMax !== undefined && tp.priceMax !== null ? String(tp.priceMax) : '');
      setTeachingMode(tp.teachingMode || 'BOTH');
      setWhatsapp(tp.whatsapp || '');
      setTelegram(tp.telegram || '');
      setWebsite(tp.website || '');
      setStoreLocation(tp.storeLocation || '');

      // Qualifications
      const rawQ = tp.qualifications;
      if (Array.isArray(rawQ)) {
        setQualificationsList(rawQ.slice(0, 10));
      } else if (typeof rawQ === 'string') {
        try {
          const parsed = JSON.parse(rawQ);
          if (Array.isArray(parsed)) setQualificationsList(parsed.slice(0, 10));
          else setQualificationsList(rawQ.split(/[\n,]/).map((s: string) => s.trim()).filter(Boolean).slice(0, 10));
        } catch {
          setQualificationsList(rawQ.split(/[\n,]/).map((s: string) => s.trim()).filter(Boolean).slice(0, 10));
        }
      } else {
        setQualificationsList([]);
      }

      // Subjects
      const rawSub = tp.subjects;
      if (Array.isArray(rawSub)) setSelectedSubjects(rawSub);
      else if (typeof rawSub === 'string') {
        try {
          const parsed = JSON.parse(rawSub);
          if (Array.isArray(parsed)) setSelectedSubjects(parsed);
          else setSelectedSubjects(rawSub.split(/[,،]/).map((s: string) => s.trim()).filter(Boolean));
        } catch {
          setSelectedSubjects(rawSub.split(/[,،]/).map((s: string) => s.trim()).filter(Boolean));
        }
      } else {
        setSelectedSubjects([]);
      }

      // Levels
      const rawLvl = tp.educationLevels;
      if (Array.isArray(rawLvl)) setSelectedLevels(rawLvl);
      else if (typeof rawLvl === 'string') {
        try {
          const parsed = JSON.parse(rawLvl);
          if (Array.isArray(parsed)) setSelectedLevels(parsed);
          else setSelectedLevels(rawLvl.split(/[,،]/).map((s: string) => s.trim()).filter(Boolean));
        } catch {
          setSelectedLevels(rawLvl.split(/[,،]/).map((s: string) => s.trim()).filter(Boolean));
        }
      } else {
        setSelectedLevels([]);
      }
    } else if (user.role === 'STUDENT') {
      setEducationLevel(user.studentProfile?.educationLevel || 'BAC Prep (البكالوريا)');
    } else if (user.role === 'PARENT') {
      setBudgetRange(user.parentProfile?.budgetRange || '');
    }

    setError('');
    setSuccessMsg('');
    setActiveTab('profile');
  }, [user, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccessMsg('');

    if (user.role === 'TEACHER') {
      if (priceMin && priceMax && parseInt(priceMin, 10) > parseInt(priceMax, 10)) {
        setError('السعر الأدنى لا يمكن أن يتجاوز السعر الأقصى.');
        setIsSaving(false);
        return;
      }
      if (whatsapp && whatsapp.trim()) {
        const waVal = validateAlgerianPhone(whatsapp, false);
        if (!waVal.isValid) {
          setError(waVal.error || 'رقم الواتساب غير صالح.');
          setIsSaving(false);
          return;
        }
      }
    }

    try {
      const payload: any = {
        fullName: fullName.trim(),
        avatarUrl: avatarUrl || null,
        wilaya,
      };

      if (user.role === 'TEACHER') {
        payload.teacherProfile = {
          headline: headline.trim(),
          bio: bio.trim(),
          experienceYears: parseInt(experienceYears, 10) || 0,
          qualifications: qualificationsList,
          subjects: selectedSubjects,
          educationLevels: selectedLevels,
          pricingInfo: pricingInfo.trim(),
          priceMin: priceMin.trim() !== '' ? parseInt(priceMin, 10) : null,
          priceMax: priceMax.trim() !== '' ? parseInt(priceMax, 10) : null,
          teachingMode,
          whatsapp: whatsapp.trim() || null,
          telegram: telegram.trim() || null,
          website: website.trim() || null,
          storeLocation: storeLocation.trim() || null,
        };
      } else if (user.role === 'STUDENT') {
        payload.studentProfile = { educationLevel };
      } else if (user.role === 'PARENT') {
        payload.parentProfile = { budgetRange };
      }

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('تم حفظ التغييرات بنجاح!');
        setTimeout(() => {
          onClose();
          if (onProfileUpdated) onProfileUpdated();
        }, 600);
      } else {
        setError(data.error || 'فشل حفظ الملف الشخصي.');
      }
    } catch {
      setError('حدث خطأ في الاتصال بالخادم.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="تعديل وتحديث الملف الشخصي">
      <div className="space-y-4 text-stone-100 max-h-[80vh] overflow-y-auto p-1">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                : 'text-stone-400 hover:text-stone-200 hover:bg-slate-800/60'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            المعلومات الأساسية
          </button>

          {user.role === 'TEACHER' && (
            <button
              type="button"
              onClick={() => setActiveTab('teaching')}
              className={`px-3 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'teaching'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-slate-800/60'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              بيانات التدريس والمتجر
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`px-3 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                : 'text-stone-400 hover:text-stone-200 hover:bg-slate-800/60'
            }`}
          >
            <Shield className="w-4 h-4" />
            الأمان وكلمة المرور
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs sm:text-sm rounded-xl font-bold">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-teal-950/80 border border-teal-800 text-teal-300 text-xs sm:text-sm rounded-xl font-bold">
            {successMsg}
          </div>
        )}

        {/* Tab 1: Profile & Basic Info */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs sm:text-sm font-bold text-stone-200">الصورة الشخصية</p>
                <p className="text-[11px] sm:text-xs text-stone-400">ارفع صورة شخصية واضحة واحترافية.</p>
              </div>
              <ProfileImageUploader
                currentAvatarUrl={avatarUrl}
                name={fullName || user.fullName}
                onUploadSuccess={(url) => setAvatarUrl(url)}
                size={72}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-stone-300">الاسم الكامل *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="الاسم واللقب"
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm sm:text-base text-white focus:border-teal-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-stone-300">الولاية (Wilaya) *</label>
              <select
                value={wilaya}
                onChange={(e) => setWilaya(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm sm:text-base text-white focus:border-teal-500 outline-none"
              >
                {WILAYAS.map((w) => (
                  <option key={w.code} value={w.name}>
                    {w.code} - {w.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Student specific */}
            {user.role === 'STUDENT' && (
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-stone-300">المرحلة الدراسية</label>
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm sm:text-base text-white focus:border-teal-500 outline-none"
                >
                  {EDUCATION_LEVELS.map((lvl) => (
                    <option key={lvl.id} value={lvl.label}>
                      {lvl.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Parent specific */}
            {user.role === 'PARENT' && (
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-stone-300">الميزانية التقديرية للدروس</label>
                <input
                  type="text"
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                  placeholder="مثال: 5,000 - 15,000 دج شهرياً"
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm sm:text-base text-white focus:border-teal-500 outline-none"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <Button variant="outline" size="sm" type="button" onClick={onClose} className="border-slate-700 text-stone-300">
                إلغاء
              </Button>
              <Button variant="primary" size="sm" isLoading={isSaving} type="submit" className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold">
                <Save className="w-4 h-4" /> حفظ التغييرات
              </Button>
            </div>
          </form>
        )}

        {/* Tab 2: Teaching & Store Profile */}
        {activeTab === 'teaching' && user.role === 'TEACHER' && (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-stone-300">العنوان المهني (Headline) *</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="أستاذ الفيزياء والرياضيات - طور البكالوريا"
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm sm:text-base text-white focus:border-teal-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-stone-300">النبذة التعريفية (Bio) *</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="اكتب نبذة عن مسيرتك التعليمية وخبرتك وطرق التدريس المتبعة..."
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm sm:text-base text-white focus:border-teal-500 outline-none"
              />
            </div>

            {/* Qualifications */}
            <div className="space-y-2 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold text-teal-300 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-teal-400" />
                  المؤهلات العلمية والشهادات (حتى 10 مؤهلات)
                </label>
                <span className={`text-xs font-mono font-bold ${qualificationsList.length >= 10 ? 'text-amber-400' : 'text-stone-400'}`}>
                  {qualificationsList.length} / 10
                </span>
              </div>

              {qualificationsList.length > 0 && (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {qualificationsList.map((q, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-slate-800/80 rounded-lg text-xs sm:text-sm border border-slate-700">
                      <span className="text-white truncate flex-1">{q}</span>
                      <button
                        type="button"
                        onClick={() => setQualificationsList((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-stone-400 hover:text-rose-400 transition-colors p-1"
                        title="حذف المؤهل"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {qualificationsList.length < 10 && (
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newQualification}
                    onChange={(e) => setNewQualification(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newQualification.trim() && qualificationsList.length < 10) {
                          setQualificationsList((prev) => [...prev, newQualification.trim()]);
                          setNewQualification('');
                        }
                      }
                    }}
                    placeholder="مثال: ماستر في الرياضيات التطبيقية - جامعة باب الزوار"
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm sm:text-base text-white placeholder-stone-500 focus:border-teal-500 outline-none"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!newQualification.trim() || qualificationsList.length >= 10}
                    onClick={() => {
                      if (newQualification.trim() && qualificationsList.length < 10) {
                        setQualificationsList((prev) => [...prev, newQualification.trim()]);
                        setNewQualification('');
                      }
                    }}
                    className="gap-1 border-teal-600 text-teal-300 hover:bg-teal-950/40 text-xs py-1.5"
                  >
                    <Plus className="w-4 h-4" /> إضافة
                  </Button>
                </div>
              )}
            </div>

            {/* Subjects Selection */}
            <div className="space-y-1.5 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
              <label className="text-xs sm:text-sm font-bold text-teal-300 block">
                المواد التعليمية والتخصصات
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                {SUBJECTS.map((s) => {
                  const isSelected = selectedSubjects.includes(s.name);
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => {
                        setSelectedSubjects((prev) =>
                          isSelected ? prev.filter((item) => item !== s.name) : [...prev, s.name]
                        );
                      }}
                      className={`text-xs sm:text-sm font-bold px-2.5 py-1.5 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-teal-600 border-teal-400 text-white'
                          : 'bg-slate-800/80 border-slate-700 text-stone-300 hover:border-slate-500'
                      }`}
                    >
                      {s.name} {isSelected && '✓'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Education Levels Selection */}
            <div className="space-y-1.5 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
              <label className="text-xs sm:text-sm font-bold text-teal-300 block">
                المراحل والأطوار التعليمية المستهدفة
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                {EDUCATION_LEVELS.map((lvl) => {
                  const isSelected = selectedLevels.includes(lvl.label);
                  return (
                    <button
                      type="button"
                      key={lvl.id}
                      onClick={() => {
                        setSelectedLevels((prev) =>
                          isSelected ? prev.filter((item) => item !== lvl.label) : [...prev, lvl.label]
                        );
                      }}
                      className={`text-xs sm:text-sm font-bold px-2.5 py-1.5 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-teal-600 border-teal-400 text-white'
                          : 'bg-slate-800/80 border-slate-700 text-stone-300 hover:border-slate-500'
                      }`}
                    >
                      {lvl.label} {isSelected && '✓'}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-stone-300">سنوات الخبرة التعليمية</label>
                <input
                  type="number"
                  min={0}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm sm:text-base text-white focus:border-teal-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-stone-300">طريقة تقديم الدروس</label>
                <select
                  value={teachingMode}
                  onChange={(e) => setTeachingMode(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm sm:text-base text-white focus:border-teal-500 outline-none"
                >
                  <option value="BOTH">حضوري وعن بعد (Both / Hybrid)</option>
                  <option value="ONLINE">عن بعد فقط (Online)</option>
                  <option value="IN_PERSON">حضوري فقط (In-Person)</option>
                </select>
              </div>
            </div>

            {/* Pricing */}
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2.5">
              <label className="text-xs sm:text-sm font-bold text-amber-300 block">
                تسعيرة الدروس والحصص (DZD)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-stone-400">السعر الأدنى للحصة / الشهر (دج)</label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    placeholder="مثال: 1500"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm sm:text-base text-white focus:border-teal-500 font-mono outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-stone-400">السعر الأقصى للحصة / الشهر (دج)</label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    placeholder="مثال: 2500"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm sm:text-base text-white focus:border-teal-500 font-mono outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1 pt-1">
                <label className="text-xs text-stone-400">ملاحظات تسعير إضافية (اختياري)</label>
                <input
                  type="text"
                  value={pricingInfo}
                  onChange={(e) => setPricingInfo(e.target.value)}
                  placeholder="مثال: 2000 دج للحصة الفردية، 1200 دج لحصص المجموعات"
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm sm:text-base text-white focus:border-teal-500 outline-none"
                />
              </div>
            </div>

            {/* Social & Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-teal-300">رقم WhatsApp</label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="0555000000"
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm sm:text-base text-white font-mono outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-teal-300">حساب Telegram</label>
                <input
                  type="text"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder="@username"
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm sm:text-base text-white font-mono outline-none"
                />
              </div>
            </div>

            {/* Website */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-teal-300">الموقع الإلكتروني (Website)</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm sm:text-base text-white font-mono placeholder-stone-500 outline-none"
              />
              <p className="text-xs text-stone-400">يجب أن يبدأ بـ https://</p>
            </div>

            {/* Store Location */}
            <div className="space-y-1.5 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
              <label className="text-xs sm:text-sm font-bold text-teal-300 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-teal-400" />
                الموقع الجغرافي / عنوان مقر التدريس للمتجر (Store Location)
              </label>
              <input
                type="text"
                value={storeLocation}
                onChange={(e) => setStoreLocation(e.target.value)}
                placeholder="مثال: القبة، الجزائر العاصمة - بالقرب من ثانوية الغزالي"
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm sm:text-base text-white placeholder-stone-500 outline-none"
              />
              <p className="text-xs text-stone-400 pt-1">
                يظهر هذا العنوان للطلاب والأولياء في تفاصيل منتجاتك بالمتجر للمساعدة على استلام الكتب والمواد حضورياً.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <Button variant="outline" size="sm" type="button" onClick={onClose} className="border-slate-700 text-stone-300">
                إلغاء
              </Button>
              <Button variant="primary" size="sm" isLoading={isSaving} type="submit" className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold">
                <Save className="w-4 h-4" /> حفظ التغييرات
              </Button>
            </div>
          </form>
        )}

        {/* Tab 3: Security Settings (Real Phone & Password change) */}
        {activeTab === 'security' && (
          <div className="pt-2">
            <SecuritySettings />
          </div>
        )}
      </div>
    </Modal>
  );
};