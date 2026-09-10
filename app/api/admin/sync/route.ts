import { handle, ok, tooManyRequests } from '@/lib/api';
import { getStore } from '@/lib/db';
import { CRM_VACANCIES } from '@/lib/db/seed-data';
import { assertSameOrigin, audit, requireRole } from '@/lib/security/guards';
import { rateLimit } from '@/lib/security/rate-limit';
import { toSyncRunDTO } from '@/lib/services';

export const runtime = 'nodejs';

/**
 * Синхронизация вакансий из CRM агентства.
 *
 * Источник здесь — фиксированная выгрузка: в бою на её месте окажется
 * HTTP-запрос к CRM, но контракт (`CrmVacancyInput[]`) и вся обработка —
 * сопоставление по crmId, снятие с публикации пропавших, журнал запусков —
 * уже боевые.
 *
 * Каждый запуск пишется в SyncRun целиком, включая падения: «синхронизация
 * не прошла, а никто не заметил» — худший из сценариев.
 */
export async function POST(request: Request) {
  return handle(async () => {
    assertSameOrigin(request);
    const session = await requireRole('ADMIN');

    const limit = await rateLimit('sync', session.accountId);
    if (!limit.ok) return tooManyRequests(limit.retryAfter);

    const store = await getStore();
    const run = await store.syncRuns.start('crm');

    try {
      const outcome = await store.vacancies.syncFromCrm(await fetchCrmVacancies());
      const finished = await store.syncRuns.finish(run.id, { status: 'SUCCESS', ...outcome });
      await audit(
        session,
        { action: 'sync.run', entity: 'SyncRun', entityId: run.id, meta: { ...outcome } },
        request.headers,
      );
      return ok({ run: finished ? toSyncRunDTO(finished) : null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
      const finished = await store.syncRuns.finish(run.id, { status: 'FAILED', error: message });
      await audit(session, { action: 'sync.failed', entity: 'SyncRun', entityId: run.id }, request.headers);
      return ok({ run: finished ? toSyncRunDTO(finished) : null }, { status: 502 });
    }
  });
}

async function fetchCrmVacancies() {
  const endpoint = process.env.CRM_SYNC_URL;
  if (!endpoint) return CRM_VACANCIES;

  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${process.env.CRM_SYNC_TOKEN ?? ''}` },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`CRM ответила ${response.status}`);
  const payload = (await response.json()) as { vacancies?: typeof CRM_VACANCIES };
  return (payload.vacancies ?? []).map((v) => ({ ...v, publishedAt: new Date(v.publishedAt) }));
}
