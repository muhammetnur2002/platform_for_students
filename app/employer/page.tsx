import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { EmployerBoard } from '@/components/screens/EmployerBoard';
import { countUnread } from '@/lib/chat';
import { requireEmployerPage } from '@/lib/security/guards';
import { buildEmployerBoard } from '@/lib/services';

export const metadata: Metadata = { title: 'Кабинет работодателя' };
export const dynamic = 'force-dynamic';

export default async function EmployerPage() {
  const { employer } = await requireEmployerPage('/employer');
  const [board, unread] = await Promise.all([
    buildEmployerBoard(employer.id),
    countUnread({ role: 'EMPLOYER', profileId: employer.id }),
  ]);

  return (
    <AppShell
      user={{ name: employer.companyName, subtitle: employer.contactName }}
      nav={[
        { href: '/employer', label: 'Отклики', badge: board.applications.length, exact: true },
        { href: '/employer/messages', label: 'Сообщения', badge: unread },
      ]}
    >
      <EmployerBoard board={board} />
    </AppShell>
  );
}
