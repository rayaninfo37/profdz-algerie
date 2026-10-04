import React from 'react';
import { KRYTY_ASSETS } from '@/lib/assets';
import { ShieldCheck, GraduationCap, Users, BookOpen, Award, CheckCircle, Sparkles, Search, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { extractYouTubeId } from '@/lib/youtubeUtils';
import { headers } from 'next/headers';

// Real-Time Dynamic Rendering: Always fresh, reflective of all platform updates
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AboutKrytyPage() {
  // Tell Netlify CDN to NEVER store this page — must be awaited to take effect
  await headers();

  // ALWAYS fallback to official PROF DZ YouTube video — never show a broken file
  const OFFICIAL_YT_ID = '9ERQ4_v7B7c';

  const setting = await prisma.platformSetting.findUnique({
    where: { key: 'aboutPlatformVideoUrl' },
  });
  const customVideoUrl = setting?.value?.trim() || '';

  // Extract YouTube ID from DB value if it's a YouTube URL
  const extractedId = extractYouTubeId(customVideoUrl);

  // Use extracted ID if valid, otherwise unconditionally use official video
  const youtubeId = extractedId || KRYTY_ASSETS.about.officialYouTubeId || OFFICIAL_YT_ID;

  // Local video only if path is explicitly /media/ (never /uploads/ which may be corrupt)
  const isLocalVideo =
    !youtubeId &&
    customVideoUrl &&
    customVideoUrl.startsWith('/media/') &&
    /\.(mp4|webm)$/i.test(customVideoUrl);

  const corePillars = [
    {
      num: '01',
      title: 'استكشاف نخبوي دقيق',
      description: 'محرك بحث متطور يتيح للتلاميذ والطلبة تصفية الكفاءات حسب المادة، المستوى، والولاية (حضوري أو عن بُعد) مع معلومات واضحة وشفافة.',
      icon: Search,
    },
    {
      num: '02',
      title: 'مصداقية وتوثيق رسمي',
      description: 'نظام توثيق صارم بالشهادات الأكاديمية مع ترتيب موضوعي عادل يمنع التلاعب، ويحمي تجربة الطالب والأستاذ على حد سواء.',
      icon: ShieldCheck,
    },
    {
      num: '03',
      title: 'تواصل مباشر ومحمي',
      description: 'قنوات اتصال سريعة عبر الهاتف، واتساب، وتيليغرام لطلب الاستفسار حول الدروس أو الموارد دون أي تعقيد أو وسطاء.',
      icon: Award,
    },
    {
      num: '04',
      title: 'متجر معرفي موثوق',
      description: 'بيئة نشر رقمية للكتب، السلاسل، والملخصات النموذجية مع إمكانية التذوق والمعاينة المجانية قبل أي تواصل.',
      icon: BookOpen,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-20 text-white" dir="rtl">
      {/* 1. EDITORIAL HERO */}
      <section className="text-center space-y-6 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 text-xs font-bold shadow-sm">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>الرؤية والمنظومة التعليمية الوطنية 🇩🇿</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight tracking-tight">
          إعادة تعريف اكتشاف التعليم في الجزائر
        </h1>

        <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-medium">
          تأسست منصة <strong className="text-white font-black">{KRYTY_ASSETS.brand.nameEn} ({KRYTY_ASSETS.brand.nameAr})</strong> لتكون البيئة الرقمية الأرقى والأكثر موثوقية لربط التلاميذ والطلبة وأولياء الأمور بنخبة الأساتذة المعتمدين والمؤسسات عبر كافة الـ 58 ولاية.
        </p>
      </section>

      {/* 2. THE SINGLE DEDICATED CINEMATIC VIDEO SHOWCASE */}
      <section className="space-y-6">
        <div className="clean-card p-3 sm:p-4 bg-[#0A1A2E]/90 border border-sky-400/30 rounded-3xl overflow-hidden shadow-2xl relative">
          <div className="rounded-2xl overflow-hidden bg-black aspect-video w-full relative">
            {isLocalVideo ? (
              <video
                src={customVideoUrl}
                controls
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
                preload="metadata"
              >
                متصفحك لا يدعم تشغيل الفيديو التعريفي.
              </video>
            ) : (
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
                title="العرض التعريفي الرسمي لمنصة PROF DZ"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            )}
          </div>

          <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300 font-semibold border-t border-white/10 mt-2">
            <span className="flex items-center gap-2 text-white font-bold">
              <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
              العرض التعريفي الرسمي لمنظومة PROF DZ الرقمية
            </span>
            {youtubeId && (
              <a
                href={`https://www.youtube.com/watch?v=${youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 hover:text-white border border-red-500/40 text-xs font-bold transition-all shadow-sm"
              >
                <span>مشاهدة الفيديو على YouTube</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </a>
            )}
          </div>
        </div>
      </section>

      {/* 3. ESSENTIAL MISSION & IDENTITY STORY */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pt-6">
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest">فلسفة التأسيس</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
              لماذا وُجدت قراتي؟
            </h2>
          </div>
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
            عانى المشهد التعليمي طويلًا من التشتت والوسطاء وغياب معايير التوثيق الجادة. وُجدت قراتي لتمنح الأستاذ الجزائري المتميز واجهة رقمية تليق بمكانته الأكاديمية، وتمنح الطالب وأولياء الأمور بوصلة دقيقة لاختيار الكفاءات التعليمية بثقة مطلقة.
          </p>
          <div className="pt-2 flex items-center gap-4 text-xs font-bold text-cyan-300">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              <span>لا وسطاء في التواصل</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              <span>شهادات موثقة</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-teal-400" />
              <span>58 ولاية مغطاة</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. VALUE PROPOSITION PANELS */}
      <section className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 clean-card space-y-2 border-r-4 border-r-cyan-500 bg-[#0B132B]/85 border border-cyan-500/20 rounded-2xl shadow-xl backdrop-blur-md">
            <h4 className="text-base font-bold text-white">ماذا تقدم للطالب والولي؟</h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              بحث دقيق في 58 ولاية، توثيق أكاديمي معتمد، ترتيب موضوعي بلا تلاعب، وتواصل فوري مباشر عبر الهاتف وتطبيقات المراسلة.
            </p>
          </div>

          <div className="p-6 clean-card space-y-2 border-r-4 border-r-amber-500 bg-[#0B132B]/85 border border-cyan-500/20 rounded-2xl shadow-xl backdrop-blur-md">
            <h4 className="text-base font-bold text-white">ماذا تقدم للأستاذ والأكاديمي؟</h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              بناء هوية أكاديمية موثوقة، نشر الموارد والكتب الرقمية، واستقبال استفسارات حقيقية من طلاب وأولياء أمور جادين.
            </p>
          </div>
        </div>
      </section>

      {/* 4. THE 4 PILLARS GRID */}
      <section className="space-y-10 pt-8 border-t border-slate-800">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">الأركان الأربعة</span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">معايير بناء التميز</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {corePillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div key={idx} className="clean-card clean-card-hover p-6 flex flex-col justify-between space-y-6 bg-[#0B132B]/85 border border-cyan-500/20 hover:border-cyan-400/50 rounded-2xl shadow-xl backdrop-blur-md">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono font-black text-cyan-400">{p.num}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{p.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {p.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. EDITORIAL FINAL CALL TO ACTION */}
      <section className="text-center p-10 bg-gradient-to-b from-[#0B132B] to-slate-950 rounded-3xl border border-cyan-500/25 space-y-6 shadow-2xl">
        <h2 className="text-2xl sm:text-4xl font-black text-white">ابدأ رحلتك التعليمية الموثوقة الآن</h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          انضم إلى مجتمع قراتي التعليمي لاكتشاف الكفاءات، تصفح الموارد الأكاديمية، والتواصل مع نخبة معلمي الجزائر.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <Link href="/teachers">
            <Button variant="primary" size="lg" className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold gap-2 shadow-lg shadow-cyan-500/25 rounded-xl">
              <Sparkles className="w-5 h-5" /> دليل الأساتذة المعتمدين
            </Button>
          </Link>
          <Link href="/products">
            <Button variant="outline" size="lg" className="border-slate-700 text-white hover:bg-slate-800 font-bold gap-2 rounded-xl">
              <BookOpen className="w-5 h-5 text-cyan-400" /> المتجر التعليمي
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

