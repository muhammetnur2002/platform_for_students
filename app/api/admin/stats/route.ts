import { handle, ok } from '@/lib/api';
import { requireRole } from '@/lib/security/guards';
import { buildAdminStats, listAuditEntries, listSyncRuns } from '@/lib/services';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return handle(async () => {
    await requireRole('ADMIN');
    const [stats, runs, auditEntries] = await Promise.all([
      buildAdminStats(),
      listSyncRuns(8),
      listAuditEntries(24),
    ]);
    return ok({ stats, runs, audit: auditEntries });
  });
}
