import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Aurora } from '@/components/layout/Aurora';
import { RouteCurtain } from '@/components/motion/RouteCurtain';
import { ToastProvider } from '@/components/ui/Toast';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
  display: 'swap',
  // Продукт двуязычный по факту: названия компаний латиницей, интерфейс
  // кириллицей. Без второго набора кириллица подменялась бы системным
  // шрифтом, и заголовки «плыли» бы по ширине.
});

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
    <html lang="ru" className={inter.variable}>
      <body className="grain min-h-dvh bg-ink text-paper">
        <Aurora />
        <ToastProvider>
          <RouteCurtain>{children}</RouteCurtain>
        </ToastProvider>
      </body>
    </html>
  );
}
