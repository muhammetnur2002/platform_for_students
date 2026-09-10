import { NextResponse } from 'next/server';
import { fail, handle } from '@/lib/api';
import { getStore } from '@/lib/db';
import { getSession } from '@/lib/security/guards';
import { readStored } from '@/lib/storage';
import type { SessionUser } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Раздача фото и резюме.
 *
 * Файлы — персональные данные, поэтому доступ проверяется на каждый
 * запрос, а не однократно при выдаче ссылки. Правило простое: студент
 * видит только свои файлы, работодатель — файлы тех, кто откликнулся
 * на его вакансии, администратор — все.
 */
export async function GET(
  _request: Request,
  { params }: { params: { kind: string; name: string } },
) {
  return handle(async () => {
    const session = await getSession();
    if (!session) return fail(401, 'Требуется вход в систему', 'UNAUTHORIZED');

    const url = `/api/files/${params.kind}/${params.name}`;
    if (!(await canRead(session, url))) {
      // 404, а не 403: существование чужого файла — тоже информация
      return fail(404, 'Файл не найден', 'NOT_FOUND');
    }

    const { body, type } = await readStored(params.kind, params.name);
    return new NextResponse(new Uint8Array(body), {
      headers: {
        'Content-Type': type,
        // private: файл персональный, его не должен кешировать общий прокси
        'Cache-Control': 'private, max-age=3600',
        'Content-Disposition': 'inline',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  });
}

async function canRead(session: SessionUser, url: string): Promise<boolean> {
  if (session.role === 'ADMIN') return true;
  const store = await getStore();

  if (session.role === 'STUDENT') {
    const student = await store.students.findByAccountId(session.accountId);
    return !!student && (student.photoUrl === url || student.resumeUrl === url);
  }

  if (session.role === 'EMPLOYER') {
    const employer = await store.employers.findByAccountId(session.accountId);
    if (!employer) return false;
    const vacancies = await store.vacancies.listByEmployer(employer.id);
    const applications = await store.applications.listByVacancyIds(vacancies.map((v) => v.id));
    for (const application of applications) {
      const student = await store.students.findById(application.studentId);
      if (student && (student.photoUrl === url || student.resumeUrl === url)) return true;
    }
  }

  return false;
}
