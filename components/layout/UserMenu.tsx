'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { springSnappy } from '@/lib/motion';

/**
 * Карточка пользователя и выход.
 *
 * Выход виден всегда, а не раскрывается по наведению: на телефоне
 * наведения нет вовсе, а прятать единственное действие за меню из
 * одного пункта — лишний слой ради лишнего слоя.
 */
export function UserMenu({ name, subtitle }: { name: string; subtitle?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
    router.push('/');
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-2.5 rounded-full border border-[var(--hairline)] bg-graphite-900/50 py-1 pl-1 pr-3.5 backdrop-blur">
        <Avatar name={name} size={30} />
        <span className="hidden min-w-0 sm:block">
          <span className="block max-w-[11rem] truncate text-[13px] font-medium leading-tight text-paper">
            {name}
          </span>
          {subtitle && (
            <span className="block max-w-[11rem] truncate text-[11px] leading-tight text-paper-faint">
              {subtitle}
            </span>
          )}
        </span>
      </div>

      <motion.button
        type="button"
        onClick={logout}
        disabled={pending}
        whileHover={{ y: -1.5 }}
        whileTap={{ scale: 0.92 }}
        transition={springSnappy}
        aria-label="Выйти из аккаунта"
        title="Выйти"
        className="grid size-10 shrink-0 place-items-center rounded-full border border-[var(--hairline)] bg-graphite-900/50 text-paper/55 backdrop-blur transition-colors hover:border-danger/40 hover:text-danger disabled:opacity-50"
      >
        <LogOut className="size-4" />
      </motion.button>
    </div>
  );
}
