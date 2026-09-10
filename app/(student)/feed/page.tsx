import type { Metadata } from 'next';
import { SwipeDeck } from '@/components/swipe/SwipeDeck';
import { requireStudentPage } from '@/lib/security/guards';
import { buildFeed } from '@/lib/services';

export const metadata: Metadata = { title: 'Лента вакансий' };
export const dynamic = 'force-dynamic';

export default async function FeedPage() {
  const { student } = await requireStudentPage('/feed');
  const vacancies = await buildFeed(student.id);

  return (
    <div className="flex flex-col items-center">
      <div className="mb-2 w-full max-w-[26rem]">
        <h1 className="text-display-sm text-paper">Ваша подборка</h1>
        <p className="mt-1.5 text-[13.5px] text-paper-dim">
          Вправо — отклик уходит работодателю. Влево — вакансия уйдёт в «Пропущенные».
        </p>
      </div>

      {/* Колода получает первую подборку с сервера: пустой экран со
          скелетоном на старте здесь был бы честным, но лишним — данные
          уже есть к моменту рендера. */}
      <SwipeDeck initial={vacancies} />
    </div>
  );
}
