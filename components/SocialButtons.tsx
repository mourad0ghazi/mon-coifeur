'use client';
import Link from 'next/link';
import type { ReactNode } from 'react';

type Provider = 'google' | 'facebook' | 'apple';

export function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"/>
    </svg>
  );
}

export function FacebookIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#1877F2" d="M24 12a12 12 0 1 0-13.88 11.85v-8.38H7.08V12h3.04V9.36c0-3 1.79-4.66 4.53-4.66 1.31 0 2.68.24 2.68.24v2.95h-1.51c-1.49 0-1.95.93-1.95 1.87V12h3.32l-.53 3.47h-2.79v8.38A12 12 0 0 0 24 12z"/>
      <path fill="#fff" d="M16.66 15.47 17.19 12h-3.32V9.76c0-.94.46-1.87 1.95-1.87h1.51V4.94s-1.37-.24-2.68-.24c-2.74 0-4.53 1.66-4.53 4.66V12H7.08v3.47h3.04v8.38a12.05 12.05 0 0 0 3.76 0v-8.38h2.79z"/>
    </svg>
  );
}

export function AppleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#111" d="M17.05 12.04c-.03-2.7 2.2-4 2.3-4.06-1.25-1.83-3.2-2.08-3.9-2.1-1.66-.17-3.24.97-4.08.97-.85 0-2.14-.95-3.52-.92-1.81.03-3.49 1.05-4.42 2.67-1.89 3.27-.48 8.1 1.36 10.76.9 1.3 1.97 2.76 3.37 2.71 1.36-.06 1.87-.88 3.51-.88 1.64 0 2.1.88 3.54.85 1.46-.02 2.38-1.33 3.28-2.64 1.03-1.51 1.46-2.97 1.48-3.05-.03-.02-2.84-1.09-2.87-4.33zM14.3 4.56c.75-.91 1.26-2.17 1.12-3.43-1.08.04-2.39.72-3.17 1.63-.7.8-1.31 2.09-1.15 3.32 1.21.1 2.44-.61 3.2-1.52z"/>
    </svg>
  );
}

export function SocialButtons({ role = 'CLIENT' }: { role?: 'CLIENT' | 'COIFFEUR' }) {
  const providers: { id: Provider; label: string; icon: ReactNode; full?: boolean }[] = [
    { id: 'google', label: 'Continuer avec Google', icon: <GoogleIcon />, full: true },
    { id: 'facebook', label: 'Facebook', icon: <FacebookIcon /> },
    { id: 'apple', label: 'Apple / iCloud', icon: <AppleIcon /> },
  ];
  return (
    <div className="social-login">
      {providers.map((p) => (
        <Link
          key={p.id}
          href={`/api/v1/auth/oauth/${p.id}?role=${role}`}
          className={`social-btn ${p.id}${p.full ? ' is-full' : ''}`}
          prefetch={false}
        >
          <span className="social-icon">{p.icon}</span>
          <span className="social-label">{p.label}</span>
        </Link>
      ))}
    </div>
  );
}
