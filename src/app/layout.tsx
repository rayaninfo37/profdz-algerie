import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/context/ToastContext';
import { LocaleProvider } from '@/context/LocaleContext';
import { Navbar } from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'PROF DZ — المنظومة التعليمية الوطنية في الجزائر',
  description: 'PROF DZ منصة جزائرية تعليمية لربط التلاميذ والطلبة بالأساتذة والمدرسين عبر 58 ولاية.',
  keywords: ['PROF DZ', 'أساتذة الجزائر', 'تعليم جزائر', 'دروس خصوصية', 'منصة تعليمية', 'باك جزائر'],
  authors: [{ name: 'PROF DZ Team', url: 'https://profdz.com' }],
  creator: 'PROF DZ',
  publisher: 'PROF DZ',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://profdz.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ar_DZ',
    url: '/',
    siteName: 'PROF DZ',
    title: 'PROF DZ — المنظومة التعليمية الوطنية في الجزائر',
    description: 'PROF DZ منصة جزائرية تعليمية لربط التلاميذ والطلبة بالأساتذة عبر 58 ولاية.',
    images: [
      {
        url: '/logok.png',
        width: 512,
        height: 512,
        alt: 'PROF DZ — التعليم الجزائري',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'PROF DZ — المنظومة التعليمية الوطنية في الجزائر',
    description: 'PROF DZ منصة جزائرية لربط التلاميذ بالأساتذة والمدرسين عبر 58 ولاية.',
    images: ['/logok.png'],
    creator: '@profdz',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0ea5e9',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="text-white min-h-screen antialiased selection:bg-sky-500 selection:text-white overflow-x-hidden">
        <ToastProvider>
          <LocaleProvider>
            {/* Global Top Navigation Header (Single Source of Truth) */}
            <Navbar />
            
            {/* Expansive, Spacious Central Workspace with Cinematic Page Reveal Motion */}
            <main className="w-full min-h-[calc(100vh-80px)] px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
              {children}
            </main>
          </LocaleProvider>
        </ToastProvider>
      </body>
    </html>
  );
}