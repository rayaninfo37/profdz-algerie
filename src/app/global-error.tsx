'use client';

import { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * global-error.tsx — Root-level crash boundary for layout-level errors.
 * This replaces the root layout when a critical error occurs, so it must
 * include its own <html> and <body> tags (Next.js requirement).
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('[KRYTY Global Error Boundary]', error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body style={{ margin: 0, background: '#071E30', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '1.5rem',
          }}
        >
          <div style={{ maxWidth: '480px', width: '100%' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🚨</div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#ffffff', marginBottom: '0.75rem' }}>
              خطأ حرج في المنصة
            </h1>
            <p style={{ fontSize: '0.95rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
              حدث خطأ تقني غير متوقع في منصة PROF DZ. فريقنا التقني أُخطر تلقائياً.
            </p>
            {error.digest && (
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1.5rem', fontFamily: 'monospace' }}>
                رمز الخطأ: {error.digest}
              </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
              <button
                onClick={reset}
                style={{
                  padding: '0.75rem 2rem',
                  background: 'linear-gradient(to right, #0ea5e9, #14b8a6)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  width: '100%',
                  maxWidth: '240px',
                }}
              >
                إعادة المحاولة
              </button>
              <a
                href="/"
                style={{
                  padding: '0.75rem 2rem',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#e2e8f0',
                  borderRadius: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  width: '100%',
                  maxWidth: '240px',
                  display: 'inline-block',
                  boxSizing: 'border-box',
                }}
              >
                العودة إلى الرئيسية
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
