'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  GraduationCap,
  BookOpen,
  MessageSquare,
  Info,
  ChevronRight,
  Layers,
  LayoutDashboard,
  Sparkles,
  Instagram,
  Facebook,
  Video,
  ShieldCheck,
} from 'lucide-react';
import AvatarFallback from '@/components/common/AvatarFallback';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { useLocale } from '@/context/LocaleContext';

// Unified canonical navigation: الرئيسية | الأساتذة | المنتجات | عن المنصة
const navigationLinks = [
  { href: '/', labelAr: 'الرئيسية', labelEn: 'Home', labelFr: 'Accueil', icon: Home },
  { href: '/teachers', labelAr: 'الأساتذة', labelEn: 'Teachers', labelFr: 'Enseignants', icon: Users },
  { href: '/products', labelAr: 'المنتجات', labelEn: 'Products', labelFr: 'Ressources', icon: BookOpen },
  { href: '/about', labelAr: 'عن المنصة', labelEn: 'About PROF DZ', labelFr: 'À propos', icon: Info },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const { locale } = useLocale();
  const [collapsed, setCollapsed] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    let unsubscribe = () => {};

    import('@/lib/clientAuth').then(({ getClientAuth, subscribeToAuthChange }) => {
      getClientAuth().then((data) => {
        if (data.authenticated) {
          setCurrentUser(data.user);
        }
      }).catch(() => {});

      unsubscribe = subscribeToAuthChange((auth) => {
        setCurrentUser(auth.authenticated ? auth.user : null);
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const label = (item: { labelAr: string; labelEn: string; labelFr: string }) => item.labelAr;

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const isTeacher = currentUser?.role === 'TEACHER' || currentUser?.role === 'ACADEMIC';
  const isStudent = currentUser?.role === 'STUDENT' || currentUser?.role === 'PUPIL';
  const isParent = currentUser?.role === 'PARENT';

  const roleLabel = isTeacher
    ? 'أستاذ معتمد'
    : isStudent
    ? 'طالب / تلميذ'
    : isParent
    ? 'ولي أمر'
    : currentUser?.role;

  const dashboardHref = isTeacher
    ? '/dashboard/teacher'
    : isStudent
    ? '/dashboard/student'
    : isParent
    ? '/dashboard/parent'
    : '/admin';

  const profileHref = isTeacher && currentUser?.teacherProfile
    ? `/teachers/${currentUser.teacherProfile.id}`
    : dashboardHref;

  return (
    <aside
      className={`hidden lg:flex flex-col shrink-0 sticky top-16 h-[calc(100vh-64px)] z-30 transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      } bg-[#0A2233]/92 backdrop-blur-xl border-l border-sky-400/30 shadow-2xl`}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -left-3 top-6 w-6 h-6 bg-[#0E3550] border border-sky-400/50 rounded-full flex items-center justify-center text-sky-200 hover:text-white hover:border-sky-300 transition-all z-50 shadow-lg shadow-sky-500/20"
        title="طي/توسيع الشريط"
      >
        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
      </button>

      <div className="flex flex-col h-full overflow-hidden">
        
        {/* Permanent Top Fixed Profile Mini-Widget */}
        <div className="p-3 border-b border-white/10 bg-gradient-to-b from-sky-950/40 to-transparent">
          {currentUser ? (
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} transition-all`}>
              <Link href={profileHref} className="relative shrink-0 group/avatar">
                <AvatarFallback
                  src={currentUser.avatarUrl}
                  name={currentUser.fullName}
                  size={collapsed ? 36 : 42}
                  className="w-10 h-10 rounded-xl object-cover border-2 border-sky-400 shadow-md shadow-sky-500/30 group-hover/avatar:border-sky-300 transition-all"
                />
                {currentUser.teacherProfile?.isVerified && (
                  <div className="absolute -bottom-1 -right-1">
                    <VerifiedBadge size="sm" />
                  </div>
                )}
              </Link>

              {!collapsed && (
                <div className="flex-1 min-w-0 space-y-0.5">
                  <Link href={profileHref} className="block hover:text-sky-300 transition-colors">
                    <h4 className="text-xs font-black text-white truncate">
                      {currentUser.fullName}
                    </h4>
                  </Link>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-sky-500/25 border border-sky-400/40 text-sky-200 font-bold uppercase tracking-wider">
                      {roleLabel}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'} transition-all`}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500/30 to-teal-500/30 border border-sky-400/50 flex items-center justify-center text-sky-300 shrink-0 shadow-md shadow-sky-500/20">
                <Sparkles className="w-4 h-4 text-sky-300 animate-pulse" />
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-bold text-sky-400 uppercase tracking-wider block">PROF DZ</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Link
                      href="/login"
                      className="px-2 py-0.5 rounded-lg bg-slate-900/80 border border-sky-400/30 text-[10px] font-bold text-sky-200 hover:text-white"
                    >
                      دخول
                    </Link>
                    <Link
                      href="/register"
                      className="px-2 py-0.5 rounded-lg bg-gradient-to-r from-teal-600 to-sky-600 text-[10px] font-bold text-white hover:from-teal-500 hover:to-sky-500 shadow-sm"
                    >
                      تسجيل
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation title */}
        {!collapsed && (
          <div className="px-4 pt-3 pb-1">
            <p className="text-[10px] text-sky-300/90 font-black uppercase tracking-widest flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-sky-400" />
              أقسام المنظومة
            </p>
          </div>
        )}

        {/* Primary navigation list */}
        <nav className="flex-1 overflow-y-auto py-1 px-2 space-y-1 scrollbar-hide">
          {navigationLinks.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={label(item)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 group relative ${
                  active
                    ? 'bg-gradient-to-r from-sky-500/30 to-teal-500/20 text-sky-100 border border-sky-400/50 shadow-md shadow-sky-500/25'
                    : 'text-slate-200 hover:text-white hover:bg-white/10 border border-transparent'
                }`}
              >
                {active && (
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-sky-400 to-teal-400 rounded-l-full shadow-md shadow-sky-400" />
                )}
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? 'text-sky-300' : 'text-sky-400/80 group-hover:text-sky-200'}`} />
                {!collapsed && <span className="truncate">{label(item)}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Platform Seal, Trust Message & Official Socials (Migrated from Footer) */}
        {!collapsed && (
          <div className="p-3 border-t border-white/10 mt-auto bg-gradient-to-t from-black/40 to-transparent space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center border border-sky-400/30 shrink-0">
                <img src="/logok.png" alt="PROF DZ" className="w-full h-full object-contain p-0.5" />
              </div>
              <div className="leading-none">
                <span className="text-xs font-black text-white">PROF DZ 🇩🇿</span>
              </div>
            </div>

            <p className="text-[10px] text-sky-200/80 leading-snug">
              منظومة جزائرية موثوقة لاكتشاف نخبة الأساتذة والمؤسسات عبر 58 ولاية.
            </p>

            <div className="flex items-center gap-2 pt-1 border-t border-white/10">
              <span className="text-[9px] text-sky-400 font-bold">الحسابات الرسمية:</span>
              <div className="flex items-center gap-1.5">
                <a
                  href="https://www.instagram.com/rayandz.official/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-6 h-6 rounded-md bg-slate-900 border border-sky-400/30 text-sky-300 hover:text-pink-400 hover:border-pink-400 flex items-center justify-center transition-all"
                  title="Instagram"
                >
                  <Instagram className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://www.tiktok.com/@rayandz.official"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-6 h-6 rounded-md bg-slate-900 border border-sky-400/30 text-sky-300 hover:text-teal-300 hover:border-teal-400 flex items-center justify-center transition-all"
                  title="TikTok"
                >
                  <Video className="w-3.5 h-3.5" />
                </a>
                <a
                  href="https://www.facebook.com/RAYANDZ.OFFICIAL"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-6 h-6 rounded-md bg-slate-900 border border-sky-400/30 text-sky-300 hover:text-blue-400 hover:border-blue-400 flex items-center justify-center transition-all"
                  title="Facebook"
                >
                  <Facebook className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="pt-1 text-[9px] text-sky-400/70 text-center font-bold">
              © 2026 PROF DZ 🇩🇿
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
