import type { Metadata, Viewport } from 'next';
import { Aurora } from '@/components/layout/Aurora';
import { RouteCurtain } from '@/components/motion/RouteCurtain';
import { ToastProvider } from '@/components/ui/Toast';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Fattakhov HR Agency — работа для студентов',
    template: '%s · Fattakhov HR Agency',
  },
  description:
    'Подработка и стажировки для студентов: смахните вправо — отклик уходит работодателю. Проверенные компании, график под учёбу.',
  applicationName: 'Fattakhov Students',
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  // Свайп по карточке не должен превращаться в зум страницы
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        {/*
          Два набора из четырёх грузим заранее: интерфейс кириллический,
          названия компаний латиницей — эти встретятся на любом экране.
          Расширенные наборы браузер возьмёт сам, если они понадобятся.
        */}
        <link rel="preload" href="/fonts/inter-cyrillic.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/inter-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="grain min-h-dvh bg-ink text-paper">
        <Aurora />
        <ToastProvider>
          <RouteCurtain>{children}</RouteCurtain>
        </ToastProvider>
      </body>
    </html>
  );
}
