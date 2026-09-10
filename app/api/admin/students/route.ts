import { handle, ok } from '@/lib/api';
import { getStore } from '@/lib/db';
import { assertSameOrigin, audit, requireRole } from '@/lib/security/guards';
import { studentStatusSchema } from '@/lib/validation';

export const runtime = 'nodejs';

/** HR-менеджер вручную двигает статус студента (пауза, возврат в поиск). */
export async function PATCH(request: Request) {
  return handle(async () => {
    assertSameOrigin(request);
    const session = await requireRole('ADMIN');
    const { studentId, status } = studentStatusSchema.parse(await request.json());

    const store = await getStore();
    await store.students.setStatus(studentId, status);
    await audit(
      session,
      { action: 'student.status', entity: 'Student', entityId: studentId, meta: { status } },
      request.headers,
    );

    return ok({ studentId, status });
  });
}
