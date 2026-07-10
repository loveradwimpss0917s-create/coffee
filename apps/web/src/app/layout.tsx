import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Coffee Recipe Lab',
  description: '味から逆算する、コーヒードリップレシピ生成アプリ',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#2b241d' },
    { media: '(prefers-color-scheme: light)', color: '#fafaf7' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
