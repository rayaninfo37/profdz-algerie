'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Compass,
  Users,
  Building2,
  BookOpen,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  UserPlus,
  Bell,
  Info,
  GraduationCap,
  School,
  MessageSquare,
  Instagram,
  Facebook,
  Video,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { KRYTY_ASSETS } from '@/lib/assets';
import AvatarFallback from '@/components/common/AvatarFallback';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { useLocale } from '@/context/LocaleContext';

export const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale } = useLocale();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(() => {
    import('@/lib/clientAuth').then(({ getClientAuth }) => {
      getClientAuth().then((data) => {
        if (data.authenticated) {
          setCurrentUser(data.user);
          fetch('/api/notifications')
            .then((r) => r.json())
            .then((n) => setNotifications(n.notifications || []))
            .catch(() => {});
          const todayStr = new Date().toISOString().split('T')[0];
          const visitKey = `kryty_visit_${todayStr}_${data.user.id}`;
          if (!sessionStorage.getItem(visitKey)) {
            sessionStorage.setItem(visitKey, '1');
            fetch('/api/visits/record', { method: 'POST' }).catch(() => {});
          }
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    });
  }, []); // Fetch once on mount — auth state persists across navigation via deduplicated client cache

  const handleMarkNotificationsRead = async () => {
    setNotifDropdownOpen(!notifDropdownOpen);
    if (!notifDropdownOpen) {
      await fetch('/api/notifications', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  };

  const handleLogout = async () => {
    const { clearClientAuthCache } = await import('@/lib/clientAuth');
    await fetch('/api/auth/logout', { method: 'POST' });
    clearClientAuthCache();
    setCurrentUser(null);
    router.push('/login');
    router.refresh();
  };

  // Canonical Global Top Navigation: الرئيسية | الأساتذة | المنتجات | عن PROF DZ
  const navItems = [
    { href: '/', labelAr: 'الرئيسية', labelEn: 'Home', labelFr: 'Accueil', icon: Compass },
    { href: '/teachers', labelAr: 'الأساتذة', labelEn: 'Teachers', labelFr: 'Enseignants', icon: Users },
    { href: '/products', labelAr: 'المنتجات', labelEn: 'Products', labelFr: 'Ressources', icon: BookOpen },
    { href: '/about', labelAr: 'عن PROF DZ', labelEn: 'About PROF DZ', labelFr: 'À propos', icon: Info },
  ];

  const getLabel = (item: { labelAr: string; labelEn: string; labelFr: string }) => item.labelAr;

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

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-50 w-full bg-[#071E30]/95 backdrop-blur-xl border-b border-sky-400/30 text-white shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Brand Identity & Official Socials */}
          <div className="flex items-center gap-4 shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl overflow-hidden bg-sky-950/70 flex items-center justify-center border-2 border-sky-400/50 group-hover:border-sky-300 transition-all shadow-md shadow-sky-500/25 shrink-0">
                <img
                  src="/logok.png"
                  alt="PROF DZ Logo"
                  className="w-full h-full object-contain p-0.5"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-black text-2xl tracking-tight text-white group-hover:text-sky-300 transition-colors font-sans">
                    PROF DZ
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/35 font-bold">
                    🇩🇿
                  </span>
                </div>
                <span className="text-[10px] text-sky-300/90 font-bold tracking-wider uppercase mt-1">
                  المنظومة التعليمية الوطنية
                </span>
              </div>
            </Link>

            {/* Official Social Media Destinations with authentic brand colors and neon glows */}
            <div className="hidden lg:flex items-center gap-2 pr-3 border-r border-white/15">
              {/* Instagram */}
              <a
                href="https://www.instagram.com/rayandz.official/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="PROF DZ Instagram"
                className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] p-0.5 hover:scale-110 hover:shadow-[0_0_15px_rgba(221,42,123,0.6)] transition-all duration-300 flex items-center justify-center shrink-0"
              >
                <div className="w-full h-full bg-[#0B2538]/70 rounded-[10px] flex items-center justify-center">
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
              </a>

              {/* TikTok */}
              <a
                href="https://www.tiktok.com/@rayandz.official"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="PROF DZ TikTok"
                className="w-8 h-8 rounded-xl bg-black border border-sky-400/40 hover:border-cyan-400 hover:scale-110 hover:shadow-[0_0_15px_rgba(37,244,238,0.6)] transition-all duration-300 flex items-center justify-center shrink-0 relative overflow-hidden"
              >
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.27 6.27 0 0 0 1.88-4.48V8.71a8.21 8.21 0 0 0 4.89 1.59V6.85a4.8 4.8 0 0 1-1-.16z"/>
                </svg>
              </a>

              {/* Facebook */}
              <a
                href="https://www.facebook.com/RAYANDZ.OFFICIAL"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="PROF DZ Facebook"
                className="w-8 h-8 rounded-xl bg-[#1877F2] hover:scale-110 hover:shadow-[0_0_15px_rgba(24,119,242,0.6)] transition-all duration-300 flex items-center justify-center shrink-0 shadow-sm"
              >
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="https://www.youtube.com/channel/UCUPRAB3DSfQ85wt5lQwKKqQ"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="PROF DZ YouTube"
                className="w-8 h-8 rounded-xl bg-[#FF0000] hover:scale-110 hover:shadow-[0_0_15px_rgba(255,0,0,0.6)] transition-all duration-300 flex items-center justify-center shrink-0 shadow-sm"
              >
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Desktop Global Top Navigation */}
          <nav className="hidden xl:flex items-center gap-1 bg-slate-950/60 p-1 rounded-full border border-sky-400/30 backdrop-blur-md shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-500 to-teal-500 text-white shadow-md shadow-sky-500/35 border border-sky-300/40'
                      : 'text-slate-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-sky-300" />
                  {getLabel(item)}
                </Link>
              );
            })}
          </nav>

          {/* Controls: Search / Quick Action + Prominent Profile Anchor in Header */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="w-32 h-10 bg-slate-800/60 animate-pulse rounded-2xl" />
            ) : currentUser ? (
              <div className="flex items-center gap-3">
                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={handleMarkNotificationsRead}
                    className="p-2 text-slate-300 hover:text-sky-300 hover:bg-white/5 rounded-xl transition-colors relative"
                    title={t.visitors.recentVisitors}
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown */}
                  {notifDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-80 bg-[#0C2B40] border border-sky-400/30 rounded-2xl shadow-2xl p-4 z-50 space-y-3 animate-fadeIn text-slate-200 backdrop-blur-xl">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Bell className="w-3.5 h-3.5 text-sky-400" /> Notifications
                        </h4>
                        <span className="text-[10px] text-slate-400 font-bold">{notifications.length}</span>
                      </div>

                      {notifications.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {notifications.map((n) => (
                            <div key={n.id} className={`p-2.5 rounded-xl border text-xs space-y-1 ${n.isRead ? 'bg-slate-900/40 border-white/5 text-slate-400' : 'bg-sky-950/40 border-sky-400/30 text-white font-bold'}`}>
                              <span className="block text-sky-300 font-bold">{n.title}</span>
                              <p className="text-[11px] leading-relaxed text-slate-300">{n.message}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic text-center py-4">No new notifications</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Dashboard Button */}
                <Link href={dashboardHref}>
                  <Button variant="outline" size="sm" className="gap-1.5 text-sky-200 border-sky-400/40 bg-slate-900/60 hover:bg-slate-800 hover:text-white hover:border-sky-400/70">
                    <LayoutDashboard className="w-4 h-4 text-sky-400" />
                    {t.common.dashboard}
                  </Button>
                </Link>

                {/* Persistent Live Mini Profile in Header with Dropdown Container */}
                <div className="relative">
                  <div className="flex items-center gap-2 p-1.5 px-3 rounded-2xl bg-[#092235]/90 border border-sky-400/40 hover:border-sky-300 transition-all shadow-md shadow-sky-500/15 group">
                    <Link href={profileHref} className="flex items-center gap-2.5">
                      <div className="relative shrink-0">
                        <AvatarFallback
                          src={currentUser.avatarUrl}
                          name={currentUser.fullName}
                          role={currentUser.role}
                          size={38}
                          className="w-9 h-9 border border-sky-400/60 group-hover:scale-105 transition-transform"
                        />
                        {currentUser.teacherProfile?.isVerified && (
                          <div className="absolute -bottom-1 -right-1">
                            <VerifiedBadge size="sm" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col text-right leading-tight">
                        <span className="text-xs font-black text-white max-w-[130px] truncate group-hover:text-sky-300 transition-colors">
                          {currentUser.fullName}
                        </span>
                        <span className="text-[10px] text-sky-300 font-bold uppercase tracking-wider">
                          {roleLabel}
                        </span>
                      </div>
                    </Link>

                    {/* Dropdown chevron trigger */}
                    <button
                      onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                      className="p-1 text-sky-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                      aria-label="قائمة البروفايل"
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* Profile Anchor Dropdown Menu */}
                  {profileDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-64 bg-[#092235]/95 border border-sky-400/40 rounded-2xl shadow-2xl p-4 z-50 space-y-3 animate-fadeIn text-white backdrop-blur-2xl">
                      <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                        <AvatarFallback
                          src={currentUser.avatarUrl}
                          name={currentUser.fullName}
                          size={44}
                          className="w-11 h-11 border-2 border-sky-400"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-white truncate">{currentUser.fullName}</p>
                          <span className="text-[10px] text-sky-300 font-bold block uppercase">{roleLabel}</span>
                          {currentUser.wilaya && (
                            <span className="text-[10px] text-slate-400 block truncate">🇩🇿 {currentUser.wilaya}</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <Link
                          href={profileHref}
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-600/30 to-teal-600/30 border border-sky-400/40 hover:border-sky-300 hover:from-sky-600/50 hover:to-teal-600/50 transition-all shadow-sm group/btn"
                        >
                          <div className="flex items-center gap-2">
                            <LayoutDashboard className="w-4 h-4 text-sky-300 group-hover/btn:scale-110 transition-transform" />
                            <span>{isTeacher ? 'ملفي الأكاديمي ولوحة التحكم' : 'حسابي التعليمي ولوحة التحكم'}</span>
                          </div>
                          <span className="text-[10px] text-sky-300 bg-sky-950/60 px-2 py-0.5 rounded-full border border-sky-400/30">دخول</span>
                        </Link>
                      </div>

                      <div className="pt-2 border-t border-white/10">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          تسجيل الخروج
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="outline" size="sm" className="border-sky-400/40 text-sky-200 bg-slate-900/60 hover:bg-slate-800 hover:text-white">
                    {t.common.login}
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm" className="gap-1.5 bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-500 hover:to-sky-500 text-white font-bold shadow-lg shadow-sky-500/25 border-0">
                    <UserPlus className="w-4 h-4" /> {t.common.register}
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Actions: Toggle Drawer */}
          <div className="flex xl:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-200 hover:text-white rounded-xl bg-slate-900/60 border border-sky-400/30"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer (Clean, Full Menu with Anchor & Socials) */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-b border-sky-400/30 bg-[#071E30] p-4 space-y-4 animate-fadeIn shadow-2xl text-slate-200 backdrop-blur-2xl">
          {currentUser && (
            <div className="flex items-center gap-3 p-3 bg-slate-900/80 rounded-2xl border border-sky-400/30">
              <AvatarFallback
                src={currentUser.avatarUrl}
                name={currentUser.fullName}
                size={42}
                className="w-10 h-10 border border-sky-400/60"
              />
              <div className="min-w-0 flex-1">
                <span className="text-sm font-black text-white truncate block">{currentUser.fullName}</span>
                <span className="text-xs text-sky-300 font-bold uppercase">{roleLabel}</span>
              </div>
              <Link href={dashboardHref} onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" size="sm" className="bg-sky-600 text-white font-bold text-xs">
                  لوحة التحكم
                </Button>
              </Link>
            </div>
          )}

          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-sky-500 to-teal-500 text-white shadow-md shadow-sky-500/30'
                      : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4 text-sky-400" />
                  {getLabel(item)}
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs font-bold text-white">المنصات الرسمية لـ PROF DZ:</span>
            <div className="flex items-center gap-2.5">
              {/* Instagram */}
              <a
                href="https://www.instagram.com/rayandz.official/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="PROF DZ Instagram"
                className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] p-0.5 flex items-center justify-center shrink-0"
              >
                <div className="w-full h-full bg-[#0B2538]/80 rounded-[10px] flex items-center justify-center">
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
              </a>

              {/* TikTok */}
              <a
                href="https://www.tiktok.com/@rayandz.official"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="PROF DZ TikTok"
                className="w-8 h-8 rounded-xl bg-black border border-sky-400/40 flex items-center justify-center shrink-0"
              >
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.27 6.27 0 0 0 1.88-4.48V8.71a8.21 8.21 0 0 0 4.89 1.59V6.85a4.8 4.8 0 0 1-1-.16z"/>
                </svg>
              </a>

              {/* Facebook */}
              <a
                href="https://www.facebook.com/RAYANDZ.OFFICIAL"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="PROF DZ Facebook"
                className="w-8 h-8 rounded-xl bg-[#1877F2] flex items-center justify-center shrink-0 shadow-sm"
              >
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="https://www.youtube.com/channel/UCUPRAB3DSfQ85wt5lQwKKqQ"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="PROF DZ YouTube"
                className="w-8 h-8 rounded-xl bg-[#FF0000] flex items-center justify-center shrink-0 shadow-sm"
              >
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>

          {!currentUser && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" size="md" className="w-full border-white/10 text-slate-300 hover:bg-white/5">
                  {t.common.login}
                </Button>
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" size="md" className="w-full bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-500 hover:to-sky-500 text-white font-bold">
                  {t.common.register}
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
