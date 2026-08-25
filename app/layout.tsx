import type { Metadata, Viewport } from 'next';
import { PwaRegister } from '@/components/PwaRegister';
import { UXEnhancer } from '@/components/UXEnhancer';
import './globals.css';

export const metadata: Metadata = {
  title: 'HLAQTI — Réserve ta coupe. Zéro attente.',
  description: 'Les meilleurs coiffeurs de ton quartier à Casablanca. Réservation instantanée et paiement sur place.',
  manifest: '/manifest.webmanifest',
  applicationName: 'HLAQTI',
  appleWebApp: { capable: true, title: 'HLAQTI', statusBarStyle: 'black-translucent' },
  icons: { icon: '/images/icon.svg', apple: '/images/icon.svg' },
};
export const viewport: Viewport = { themeColor: '#12100E', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}<UXEnhancer/><PwaRegister/></body></html>;
}
