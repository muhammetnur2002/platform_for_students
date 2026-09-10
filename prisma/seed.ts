import { PrismaClient } from '@prisma/client';
import { blindIndex, encrypt, hashToken } from '../lib/security/crypto';
import { hashPassword } from '../lib/security/password';
import {
  CONSENT_VERSION,
  CRM_VACANCIES,
  DEMO_CREDENTIALS,
  DEMO_STUDENT_PROFILE,
} from '../lib/db/seed-data';

/**
 * Наполнение базы.
 *
 * Берёт те же фикстуры, что и демо-режим в памяти: расхождение между
 * «как выглядит на демо» и «как выглядит на базе» — источник багов,
 * которые находятся только на проде.
 *
 * Идемпотентно: повторный запуск обновляет, а не дублирует.
 */
const prisma = new PrismaClient();

async function main() {
  console.log('Заполняем базу…');

  // --- Работодатели и вакансии ---
  const employerByCrmId = new Map<string, string>();

  for (const item of CRM_VACANCIES) {
    let employerId = employerByCrmId.get(item.crmClientId);

    if (!employerId) {
      const employer = await prisma.employer.upsert({
        where: { crmClientId: item.crmClientId },
        update: { companyName: item.companyName, contactName: item.contactName },
        create: {
          companyName: item.companyName,
          contactName: item.contactName,
          crmClientId: item.crmClientId,
          account: {
            create: {
              role: 'EMPLOYER',
              emailEnc: encrypt(item.contactEmail),
              emailHash: blindIndex(item.contactEmail),
            },
          },
        },
      });
      employerId = employer.id;
      employerByCrmId.set(item.crmClientId, employerId);
    }

    const data = {
      employerId,
      title: item.title,
      summary: item.summary,
      responsibilities: item.responsibilities,
      requirements: item.requirements,
      perks: item.perks,
      salaryFrom: item.salaryFrom,
      salaryTo: item.salaryTo,
      salaryPeriod: item.salaryPeriod,
      city: item.city,
      district: item.district,
      workFormat: item.workFormat,
      employmentType: item.employmentType,
      shiftDays: item.shiftDays,
      hoursPerWeek: item.hoursPerWeek,
      tags: item.tags,
      isHot: item.isHot,
      isActive: item.isActive,
      publishedAt: item.publishedAt,
      syncedAt: new Date(),
    };

    await prisma.vacancy.upsert({
      where: { crmId: item.crmId },
      update: data,
      create: { ...data, crmId: item.crmId },
    });
  }
  console.log(`  вакансий: ${CRM_VACANCIES.length}, работодателей: ${employerByCrmId.size}`);

  // --- Код доступа работодателя ---
  const demoEmployer = await prisma.employer.findUnique({
    where: { crmClientId: DEMO_CREDENTIALS.employerCrmClientId },
  });
  if (demoEmployer) {
    const codeHash = hashToken(DEMO_CREDENTIALS.employerCode);
    await prisma.accessCode.upsert({
      where: { codeHash },
      update: {},
      create: { accountId: demoEmployer.accountId, codeHash, label: 'Демо-доступ из CRM' },
    });
    console.log(`  код доступа работодателя: ${DEMO_CREDENTIALS.employerCode}`);
  }

  // --- Администратор ---
  await upsertAccountWithPassword(
    DEMO_CREDENTIALS.admin.email,
    DEMO_CREDENTIALS.admin.password,
    'ADMIN',
  );
  console.log(`  админ: ${DEMO_CREDENTIALS.admin.email}`);

  // --- Демо-студент ---
  const studentAccount = await upsertAccountWithPassword(
    DEMO_CREDENTIALS.student.email,
    DEMO_CREDENTIALS.student.password,
    'STUDENT',
  );

  const profile = {
    fullNameEnc: encrypt(DEMO_STUDENT_PROFILE.fullName),
    phoneEnc: encrypt(DEMO_STUDENT_PROFILE.phone),
    gender: DEMO_STUDENT_PROFILE.gender,
    birthYear: DEMO_STUDENT_PROFILE.birthYear,
    university: DEMO_STUDENT_PROFILE.university,
    speciality: DEMO_STUDENT_PROFILE.speciality,
    studyYear: DEMO_STUDENT_PROFILE.studyYear,
    city: DEMO_STUDENT_PROFILE.city,
    workDays: [...DEMO_STUDENT_PROFILE.workDays],
    hoursPerWeek: DEMO_STUDENT_PROFILE.hoursPerWeek,
    skills: [...DEMO_STUDENT_PROFILE.skills],
    about: DEMO_STUDENT_PROFILE.about,
    consentVersion: CONSENT_VERSION,
    consentIp: '127.0.0.1',
  };

  await prisma.student.upsert({
    where: { accountId: studentAccount.id },
    update: profile,
    create: { accountId: studentAccount.id, ...profile },
  });
  console.log(`  студент: ${DEMO_CREDENTIALS.student.email}`);

  console.log('Готово.');
}

async function upsertAccountWithPassword(
  email: string,
  password: string,
  role: 'ADMIN' | 'STUDENT',
) {
  const emailHash = blindIndex(email);
  const passwordHash = await hashPassword(password);
  return prisma.account.upsert({
    where: { emailHash },
    update: { passwordHash, isActive: true },
    create: { role, emailEnc: encrypt(email), emailHash, passwordHash },
  });
}

main()
  .catch((error) => {
    console.error('Не удалось заполнить базу:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
