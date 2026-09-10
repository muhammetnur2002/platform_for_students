import { cn } from '@/lib/utils';
import {
  APPLICATION_STATUS_LABEL,
  STUDENT_STATUS_LABEL,
  type ApplicationStatus,
  type StudentStatus,
} from '@/lib/types';

/**
 * Статус отклика.
 *
 * Цвет несёт смысл ровно там, где нужно действие: приглашение и
 * собеседование подсвечены, потому что по ним кто-то должен ответить.
 * Выход на работу и отказ — закрытые исходы, они серые: реагировать
 * уже не на что.
 */
const APPLICATION_TONE: Record<ApplicationStatus, string> = {
  NEW: 'border-accent-400/40 bg-accent-500/16 text-accent-200',
  VIEWED: 'border-[var(--hairline-strong)] bg-paper/[0.05] text-paper/70',
  INVITED: 'border-warn/40 bg-warn/12 text-warn',
  INTERVIEW: 'border-warn/40 bg-warn/12 text-warn',
  HIRED: 'border-yes/45 bg-yes/14 text-yes-glow',
  REJECTED: 'border-[var(--hairline)] bg-paper/[0.03] text-paper-faint',
};

const STUDENT_TONE: Record<StudentStatus, string> = {
  ACTIVE: 'border-accent-400/40 bg-accent-500/16 text-accent-200',
  IN_PROGRESS: 'border-warn/40 bg-warn/12 text-warn',
  PLACED: 'border-yes/45 bg-yes/14 text-yes-glow',
  PAUSED: 'border-[var(--hairline)] bg-paper/[0.03] text-paper-faint',
};

const base =
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium leading-none whitespace-nowrap';

export function ApplicationStatusPill({
  status,
  className,
}: {
  status: ApplicationStatus;
  className?: string;
}) {
  return (
    <span className={cn(base, APPLICATION_TONE[status], className)}>
      <Dot status={status} />
      {APPLICATION_STATUS_LABEL[status]}
    </span>
  );
}

export function StudentStatusPill({
  status,
  className,
}: {
  status: StudentStatus;
  className?: string;
}) {
  return (
    <span className={cn(base, STUDENT_TONE[status], className)}>
      {STUDENT_STATUS_LABEL[status]}
    </span>
  );
}

/** Пульсирует только у новых откликов — то, что ещё никто не открыл. */
function Dot({ status }: { status: ApplicationStatus }) {
  if (status !== 'NEW') return null;
  return (
    <span className="relative flex size-1.5">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent-300 opacity-70" />
      <span className="relative inline-flex size-1.5 rounded-full bg-accent-200" />
    </span>
  );
}
