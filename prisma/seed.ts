import { hash } from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash('DemoPass123!', 10);

  const user = await prisma.user.upsert({
    where: { email: 'teacher@teacherconnect.dev' },
    update: {},
    create: {
      email: 'teacher@teacherconnect.dev',
      passwordHash,
      role: 'TEACHER',
      teacher: {
        create: {
          firstName: 'Avery',
          lastName: 'Kim',
          schoolName: 'Demo Elementary',
          timezone: 'America/Denver',
          bookingSlug: 'avery-kim',
        },
      },
    },
    include: { teacher: true },
  });

  const teacher = user.teacher;
  if (!teacher) {
    throw new Error('Demo teacher was not created');
  }

  const demoStudents = [
    { firstName: 'Maya', lastName: 'Rodriguez' },
    { firstName: 'Jordan', lastName: 'Lee' },
    { firstName: 'Alex', lastName: 'Martinez' },
    { firstName: 'Sofia', lastName: 'Garcia' },
    { firstName: 'Ethan', lastName: 'Wilson' },
  ];

  for (const student of demoStudents) {
    const existing = await prisma.student.findFirst({
      where: {
        teacherId: teacher.id,
        firstName: student.firstName,
        lastName: student.lastName,
      },
    });

    if (!existing) {
      await prisma.student.create({
        data: {
          teacherId: teacher.id,
          firstName: student.firstName,
          lastName: student.lastName,
        },
      });
    }
  }

  console.log('Seeded demo teacher: teacher@teacherconnect.dev / DemoPass123!');
  console.log('Seeded fictional students only. Never add real student data.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
