'use client';

import { useState } from 'react';
import { cn, companyGradient, initials } from '@/lib/utils';

/**
 * Аватар человека или компании.
 *
 * Пока фото нет (а у студента его чаще всего нет), показываются инициалы
 * на детерминированной подложке: у одного и того же имени всегда один и
 * тот же оттенок, и список людей остаётся различимым без фотографий.
 */
export function Avatar({
  name,
  src,
  size = 44,
  rounded = 'full',
  className,
}: {
  name: string;
  src?: string | null;
  size?: number;
  rounded?: 'full' | 'square';
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden border border-[var(--hairline)]',
        rounded === 'full' ? 'rounded-full' : 'rounded-2xl',
        className,
      )}
      style={{
        width: size,
        height: size,
        background: showImage ? undefined : companyGradient(name),
      }}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- файлы отдаёт защищённый роут, оптимизатор к нему не ходит
        <img
          src={src}
          alt={name}
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <span
          className="font-medium leading-none text-paper/85"
          style={{ fontSize: Math.max(11, size * 0.34) }}
        >
          {initials(name)}
        </span>
      )}
      {/* Внутренний блик: без него аватар выглядит наклейкой поверх стекла */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 shadow-hairline"
        style={{ borderRadius: 'inherit' }}
      />
    </span>
  );
}
