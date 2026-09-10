import type { Metadata } from 'next';
import { ApplicationsList } from '@/components/screens/ApplicationsList';
import { requireStudentPage } from '@/lib/security/guards';
import { listApplications } from '@/lib/services';

export const metadata: Metadata = { title: 'Мои отклики' };
export const dynamic = 'force-dynamic';

export default async function ApplicationsPage() {
  const { student } = await requireStudentPage('/applications');
  return <ApplicationsList applications={await listApplications(student.id)} />;
}
