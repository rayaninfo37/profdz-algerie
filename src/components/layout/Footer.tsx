import React from 'react';
import Link from 'next/link';
import { Instagram, Facebook, Youtube, Video } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="w-full bg-[#0B2533] border-t border-teal-900/60 text-slate-300 py-14 px-4 sm:px-6 lg:px-8 shadow-2xl mt-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Col 1: Brand & Official Social Links */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center border border-teal-400/30 shrink-0 shadow-md">
              <img
                src="/logok.png"
                alt="PROF DZ Logo"
                className="w-full h-full object-contain p-1"
              />
            </div>
            <span className="font-black text-xl text-white tracking-tight">PROF DZ 🇩🇿</span>
          </div>
          <p className="text-xs text-teal-100/70 leading-relaxed font-normal">
            منظومة رقمية جزائرية موثوقة لاكتشاف نخبة الأساتذة والمدرسين والموارد التعليمية الأكاديمية عبر 58 ولاية.
            <br />
            <span className="text-teal-400 font-semibold mt-1 inline-block">Discover → Trust → Connect → Learn.</span>
          </p>

          {/* Official Social Media Links */}
          <div className="pt-2 space-y-2">
            <span className="text-[11px] font-bold text-teal-200/90 block uppercase tracking-wider">
              حسابات المنصة الرسمية (Official Socials):
            </span>
            <div className="flex items-center gap-2.5">
              <a
                href="https://www.instagram.com/rayan.informatique/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="PROF DZ Instagram Account"
                className="w-8 h-8 rounded-lg bg-[#071923] border border-teal-900 hover:border-pink-400 hover:text-pink-300 text-teal-200 flex items-center justify-center transition-all"
              >
                <Instagram className="w-4 h-4" />
              </a>

              <a
                href="https://www.tiktok.com/@rayan.informatique"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="PROF DZ TikTok Channel"
                className="w-8 h-8 rounded-lg bg-[#071923] border border-teal-900 hover:border-teal-400 hover:text-teal-300 text-teal-200 flex items-center justify-center transition-all"
              >
                <Video className="w-4 h-4" />
              </a>

              <a
                href="https://www.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="PROF DZ Facebook Page"
                className="w-8 h-8 rounded-lg bg-[#071923] border border-teal-900 hover:border-blue-400 hover:text-blue-300 text-teal-200 flex items-center justify-center transition-all"
              >
                <Facebook className="w-4 h-4" />
              </a>

              <a
                href="https://www.youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="PROF DZ YouTube Channel"
                className="w-8 h-8 rounded-lg bg-[#071923] border border-teal-900 hover:border-red-400 hover:text-red-300 text-teal-200 flex items-center justify-center transition-all"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Col 2: Navigation & Discover */}
        <div>
          <h4 className="text-xs font-bold text-teal-300 uppercase tracking-wider mb-3">اكتشف المنظومة</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/teachers" className="text-teal-100/70 hover:text-white transition-colors">
                دليل الأساتذة والمدرسين 
              </Link>
            </li>
            <li>
              <Link href="/products" className="text-teal-100/70 hover:text-white transition-colors">
                المنتجات والموارد التعليمية
              </Link>
            </li>
            <li>
              <Link href="/about" className="text-teal-100/70 hover:text-white transition-colors">
                عن المنصة ورؤيتها
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: Account Roles & Legal */}
        <div>
          <h4 className="text-xs font-bold text-teal-300 uppercase tracking-wider mb-3">أدوار المنظومة والسياسات</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/register?role=TEACHER" className="text-teal-100/70 hover:text-white transition-colors">
                حساب أستاذ و مدرس (Teacher \ Tuteur Profile)
              </Link>
            </li>
            <li>
              <Link href="/register?role=STUDENT" className="text-teal-100/70 hover:text-white transition-colors">
                حساب تلميذ أو طالب جامعي (Student Hub)
              </Link>
            </li>
            <li>
              <Link href="/register?role=PARENT" className="text-teal-100/70 hover:text-white transition-colors">
                حساب ولي أمر (Parent Hub)
              </Link>
            </li>
            <li className="pt-2 border-t border-teal-900/60">
              <Link href="/terms" className="text-teal-200 hover:text-teal-100 font-bold transition-colors">
                سياسات الخصوصية وشروط الاستعمال
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 4: Truthful Rules */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">قواعد المنظومة الموثوقة</h4>
          <div className="p-4 bg-[#071923] border border-teal-900/80 rounded-2xl text-[11px] space-y-2 text-teal-100/80 shadow-inner">
            <div className="text-amber-300 font-bold">فترة تجريبية مجانية: 30 يوماً</div>
            <div>Pro Plan: 900 DZD / 30 Days</div>
            <div className="text-teal-300 font-semibold">Rating ≠ Ranking Rules Active</div>
            <div className="text-slate-400 text-[10px] pt-1 border-t border-teal-950">حماية الخصوصية والبيانات بموجب المعايير الجزائرية 🇩🇿</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-10 pt-5 border-t border-teal-900/60 text-center text-xs text-teal-200/50 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span>© 2026 PROF DZ. All rights reserved. Built for Algerian Education.</span>
        <span className="text-teal-300/70">تعلّم منظّم يناسب احتياجاتك</span>
      </div>
    </footer>
  );
};