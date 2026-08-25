import { hash } from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.TEACHER_EMAIL ?? '').trim().toLowerCase();
  const password = process.env.TEACHER_PASSWORD ?? '';

  if (!email || password.length < 10) {
    throw new Error(
      'Set TEACHER_EMAIL and TEACHER_PASSWORD (at least 10 characters).',
    );
  }

  const current = await prisma.user.findFirst({
    where: { role: 'TEACHER' },
    orderBy: { createdAt: 'asc' },
  });

  if (!current) {
    throw new Error('No teacher user found. Run pnpm db:seed first.');
  }

  await prisma.user.update({
    where: { id: current.id },
    data: {
      email,
      passwordHash: await hash(password, 10),
    },
  });

  console.log(`Teacher login is now ${email}`);
}

void main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
