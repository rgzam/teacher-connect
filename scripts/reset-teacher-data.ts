import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const teacher = await prisma.teacher.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  if (!teacher) {
    throw new Error('No teacher found.');
  }

  await prisma.$transaction([
    prisma.contactLog.deleteMany({ where: { teacherId: teacher.id } }),
    prisma.contactTask.deleteMany({ where: { teacherId: teacher.id } }),
    prisma.appointment.deleteMany({ where: { teacherId: teacher.id } }),
    prisma.studentGuardian.deleteMany({
      where: { student: { teacherId: teacher.id } },
    }),
    prisma.student.deleteMany({ where: { teacherId: teacher.id } }),
    prisma.guardian.deleteMany({ where: { teacherId: teacher.id } }),
    prisma.blockedDate.deleteMany({ where: { teacherId: teacher.id } }),
    prisma.notification.deleteMany({ where: { userId: teacher.userId } }),
    prisma.auditLog.deleteMany({ where: { actorUserId: teacher.userId } }),
  ]);

  console.log(
    'Cleared students, contacts, and appointments. Login, hours, and meeting types are unchanged.',
  );
}

void main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
