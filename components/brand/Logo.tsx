import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Фирменный знак: куб из букв F/H/R плюс наборный текст.
 *
 * Используется файл из брендбука, а не воспроизведение в SVG: знак —
 * это идентичность, и «почти такой же» здесь хуже, чем растр.
 */
export function Logo({
  className,
  href = '/',
  compact = false,
}: {
  className?: string;
  href?: string | null;
  compact?: boolean;
}) {
  const content = compact ? (
    <Image
      src="/brand/mark-light.png"
      alt="Fattakhov HR Agency"
      width={222}
      height={256}
      priority
      className="h-8 w-auto"
    />
  ) : (
    <Image
      src="/brand/logo-light.png"
      alt="Fattakhov HR Agency"
      width={326}
      height={128}
      priority
      className="h-8 w-auto sm:h-9"
    />
  );

  const classes = cn(
    'inline-flex items-center transition-opacity duration-300 hover:opacity-75',
    className,
  );

  if (!href) return <span className={classes}>{content}</span>;

  return (
    <Link href={href} className={classes} aria-label="Fattakhov HR Agency — на главную">
      {content}
    </Link>
  );
}
