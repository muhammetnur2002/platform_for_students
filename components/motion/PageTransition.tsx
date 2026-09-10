'use client';

import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { pageVariants } from '@/lib/motion';

/**
 * Переход между экранами.
 *
 * `mode="wait"` намеренно не используется: пауза на время выхода
 * старого экрана добавляет к каждому переходу лишние 300 мс, и
 * навигация начинает казаться медленнее, чем есть. Экраны на мгновение
 * накладываются — глаз этого не замечает, а скорость сохраняется.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="hidden"
        animate="show"
        exit="exit"
        className="min-h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
