'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Inbox } from 'lucide-react';
import { SwipeCard } from './SwipeCard';
import { SwipeControls } from './SwipeControls';
import { VacancyDetail } from './VacancyDetail';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { CubeMark } from '@/components/brand/CubeMark';
import { durations, easeOutExpo, springSoft } from '@/lib/motion';
import { plural } from '@/lib/utils';
import type { SwipeDirection, VacancyDTO } from '@/lib/types';

interface HistoryEntry {
  vacancy: VacancyDTO;
  direction: SwipeDirection;
}

/**
 * Лента свайпов.
 *
 * Решение применяется сразу, запрос уходит следом: ждать ответа сервера
 * ради анимации, которая уже началась, — значит превратить жест в
 * форму. Если запрос упал, карточка возвращается, и об этом говорят
 * прямо; молча потерянный отклик хуже видимой ошибки.
 */
export function SwipeDeck({ initial }: { initial: VacancyDTO[] }) {
  const router = useRouter();
  const toast = useToast();

  const [cards, setCards] = useState(initial);
  const [exitDir, setExitDir] = useState(1);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [detail, setDetail] = useState<VacancyDTO | null>(null);
  const [restored, setRestored] = useState<{ id: string; from: 'left' | 'right' } | null>(null);
  const [counts, setCounts] = useState({ applied: 0, skipped: 0 });
  const [hintSeen, setHintSeen] = useState(false);

  const progress = useMotionValue(0);
  const total = useRef(initial.length);
  const busy = useRef(false);

  const decide = useCallback(
    async (direction: SwipeDirection) => {
      const card = cards[0];
      if (!card || busy.current) return;
      busy.current = true;

      setExitDir(direction === 'RIGHT' ? 1 : -1);
      setCards((current) => current.slice(1));
      setHistory((current) => [...current, { vacancy: card, direction }]);
      setCounts((c) =>
        direction === 'RIGHT' ? { ...c, applied: c.applied + 1 } : { ...c, skipped: c.skipped + 1 },
      );
      setRestored(null);
      setHintSeen(true);
      progress.set(0);

      try {
        const response = await fetch('/api/swipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vacancyId: card.id, direction }),
        });
        if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error);

        if (direction === 'RIGHT') {
          toast.success('Отклик отправлен', `${card.title} · ${card.company}`);
          // Раздел «Отклики» рендерится на сервере — обновляем его данные
          router.refresh();
        }
      } catch (error) {
        setCards((current) => [card, ...current]);
        setHistory((current) => current.slice(0, -1));
        setCounts((c) =>
          direction === 'RIGHT' ? { ...c, applied: c.applied - 1 } : { ...c, skipped: c.skipped - 1 },
        );
        toast.error(
          'Не удалось сохранить решение',
          error instanceof Error && error.message ? error.message : 'Проверьте соединение',
        );
      } finally {
        busy.current = false;
      }
    },
    [cards, progress, router, toast],
  );

  const undo = useCallback(async () => {
    const last = history[history.length - 1];
    if (!last || busy.current) return;
    busy.current = true;

    setHistory((current) => current.slice(0, -1));
    setCards((current) => [last.vacancy, ...current]);
    setRestored({ id: last.vacancy.id, from: last.direction === 'RIGHT' ? 'right' : 'left' });
    setCounts((c) =>
      last.direction === 'RIGHT'
        ? { ...c, applied: Math.max(0, c.applied - 1) }
        : { ...c, skipped: Math.max(0, c.skipped - 1) },
    );

    try {
      const response = await fetch('/api/swipes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vacancyId: last.vacancy.id }),
      });
      if (!response.ok) throw new Error();
      router.refresh();
    } catch {
      toast.error('Не удалось отменить', 'Обновите страницу и попробуйте ещё раз');
    } finally {
      busy.current = false;
    }
  }, [history, router, toast]);

  // Стрелки — полноценный способ разбирать ленту с клавиатуры, а не
  // подсказка «для доступности»: на десктопе им пользуются чаще мыши.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (detail) return;

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        void decide('LEFT');
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        void decide('RIGHT');
      } else if (event.key === 'ArrowUp' && cards[0]) {
        event.preventDefault();
        setDetail(cards[0]);
      } else if (event.key.toLowerCase() === 'z' && history.length) {
        event.preventDefault();
        void undo();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cards, decide, detail, history.length, undo]);

  const done = total.current - cards.length;

  return (
    <div className="flex w-full flex-col items-center">
      <DeckProgress done={done} total={total.current} counts={counts} />

      <div className="relative mt-5 h-[clamp(460px,64dvh,600px)] w-full max-w-[26rem]">
        {/* mode по умолчанию: улетающая карточка и поднимающаяся снизу
            должны двигаться одновременно, а не по очереди */}
        <AnimatePresence custom={exitDir}>
          {cards.slice(0, 3).map((vacancy, index) => (
            <SwipeCard
              key={vacancy.id}
              vacancy={vacancy}
              index={index}
              isTop={index === 0}
              enterFrom={restored?.id === vacancy.id ? restored.from : 'stack'}
              onDecide={decide}
              onOpen={() => setDetail(vacancy)}
              onProgress={(value) => progress.set(value)}
            />
          ))}
        </AnimatePresence>

        {cards.length === 0 && <EmptyDeck applied={counts.applied} />}
      </div>

      <div className="mt-7 w-full max-w-[26rem]">
        <SwipeControls
          progress={progress}
          onSkip={() => void decide('LEFT')}
          onApply={() => void decide('RIGHT')}
          onUndo={() => void undo()}
          canUndo={history.length > 0}
          disabled={cards.length === 0}
        />

        <AnimatePresence>
          {!hintSeen && cards.length > 0 && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: durations.base, ease: easeOutExpo, delay: 0.6 }}
              className="mt-5 flex items-center justify-center gap-2 text-center text-[12.5px] text-paper-faint"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Смахните карточку или нажмите стрелку
              <ArrowRight className="size-3.5" aria-hidden />
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <VacancyDetail vacancy={detail} onClose={() => setDetail(null)} onDecide={decide} />
    </div>
  );
}

function DeckProgress({
  done,
  total,
  counts,
}: {
  done: number;
  total: number;
  counts: { applied: number; skipped: number };
}) {
  const ratio = total > 0 ? Math.min(1, done / total) : 1;

  return (
    <div className="w-full max-w-[26rem]">
      <div className="flex items-baseline justify-between text-[12.5px]">
        <span className="text-paper-faint">
          {total - done > 0
            ? `${total - done} ${plural(total - done, 'вакансия', 'вакансии', 'вакансий')} в подборке`
            : 'Подборка разобрана'}
        </span>
        <span className="flex items-center gap-3 tabular-nums">
          <span className="flex items-center gap-1 text-yes-glow">
            <Check className="size-3" aria-hidden />
            {counts.applied}
          </span>
          <span className="text-paper-faint">{counts.skipped} пропущено</span>
        </span>
      </div>

      <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-paper/[0.07]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-accent-500 to-accent-300"
          initial={false}
          animate={{ scaleX: ratio }}
          style={{ transformOrigin: 'left' }}
          transition={springSoft}
        />
      </div>
    </div>
  );
}

function EmptyDeck({ applied }: { applied: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...springSoft, delay: 0.15 }}
      className="glass absolute inset-0 flex flex-col items-center justify-center gap-5 rounded-4xl p-8 text-center"
    >
      <CubeMark className="h-20 w-20 text-paper/25" />
      <div className="space-y-2">
        <h3 className="text-display-sm text-paper">Подборка закончилась</h3>
        <p className="mx-auto max-w-[22rem] text-[14px] leading-relaxed text-paper-dim">
          {applied > 0
            ? `Вы отправили ${applied} ${plural(applied, 'отклик', 'отклика', 'откликов')}. Работодатели ответят в течение двух рабочих дней — следите за разделом «Отклики».`
            : 'Новые вакансии появляются каждый день. Загляните завтра или посмотрите пропущенные — их можно вернуть в ленту.'}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/skipped">
          <Button variant="outline" size="sm">
            Пропущенные
          </Button>
        </Link>
        <Link href="/applications">
          <Button variant="ghost" size="sm" icon={<Inbox />}>
            Мои отклики
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
