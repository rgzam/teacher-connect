import { hash } from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import {
  addDaysIso,
  calendarDateInTimeZone,
  dateOnlyUtc,
  zonedWallTimeToUtc,
} from '../apps/api/src/common/datetime';

const prisma = new PrismaClient();
const TIME_ZONE = 'America/Denver';

async function ensureAppointmentType(data: {
  teacherId: string;
  name: string;
  durationMinutes: number;
  format: 'VIRTUAL' | 'HOME_VISIT';
  description: string;
}) {
  const existing = await prisma.appointmentType.findFirst({
    where: { teacherId: data.teacherId, name: data.name },
  });

  if (existing) {
    return prisma.appointmentType.update({
      where: { id: existing.id },
      data: {
        durationMinutes: data.durationMinutes,
        format: data.format,
        description: data.description,
        isActive: true,
      },
    });
  }

  return prisma.appointmentType.create({ data });
}

async function main() {
  const passwordHash = await hash('DemoPass123!', 10);

  const user = await prisma.user.upsert({
    where: { email: 'teacher@teacherconnect.dev' },
    update: {
      teacher: {
        update: {
          firstName: 'Ly',
          lastName: 'Le',
          bookingSlug: 'ly-le',
          bufferMinutes: 5,
          minNoticeHours: 1,
          maxBookingDays: 14,
        },
      },
    },
    create: {
      email: 'teacher@teacherconnect.dev',
      passwordHash,
      role: 'TEACHER',
      teacher: {
        create: {
          firstName: 'Ly',
          lastName: 'Le',
          schoolName: 'Demo Elementary',
          timezone: TIME_ZONE,
          bookingSlug: 'ly-le',
          bufferMinutes: 5,
          minNoticeHours: 1,
          maxBookingDays: 14,
        },
      },
    },
    include: { teacher: true },
  });

  const teacher = user.teacher;
  if (!teacher) {
    throw new Error('Demo teacher was not created');
  }

  const demoFamilies = [
    {
      student: { firstName: 'Maya', lastName: 'Rodriguez' },
      guardian: { firstName: 'Elena', lastName: 'Rodriguez' },
    },
    {
      student: { firstName: 'Jordan', lastName: 'Lee' },
      guardian: { firstName: 'Chris', lastName: 'Lee' },
    },
    {
      student: { firstName: 'Alex', lastName: 'Martinez' },
      guardian: { firstName: 'Sam', lastName: 'Martinez' },
    },
    {
      student: { firstName: 'Sofia', lastName: 'Garcia' },
      guardian: { firstName: 'Lucia', lastName: 'Garcia' },
    },
    {
      student: { firstName: 'Ethan', lastName: 'Wilson' },
      guardian: { firstName: 'Morgan', lastName: 'Wilson' },
    },
  ];

  const people = new Map<string, { studentId: string; guardianId: string }>();

  for (const family of demoFamilies) {
    const student =
      (await prisma.student.findFirst({
        where: {
          teacherId: teacher.id,
          firstName: family.student.firstName,
          lastName: family.student.lastName,
        },
      })) ??
      (await prisma.student.create({
        data: { teacherId: teacher.id, ...family.student },
      }));

    const guardian =
      (await prisma.guardian.findFirst({
        where: {
          teacherId: teacher.id,
          firstName: family.guardian.firstName,
          lastName: family.guardian.lastName,
        },
      })) ??
      (await prisma.guardian.create({
        data: { teacherId: teacher.id, ...family.guardian },
      }));

    await prisma.studentGuardian.upsert({
      where: {
        studentId_guardianId: {
          studentId: student.id,
          guardianId: guardian.id,
        },
      },
      update: {},
      create: {
        studentId: student.id,
        guardianId: guardian.id,
        relationship: 'GUARDIAN',
      },
    });

    people.set(`${family.student.firstName} ${family.student.lastName}`, {
      studentId: student.id,
      guardianId: guardian.id,
    });
  }

  await prisma.appointmentType.updateMany({
    where: {
      teacherId: teacher.id,
      name: {
        in: [
          'Quick Parent Call',
          'Parent Conference',
          'Student Progress Meeting',
        ],
      },
    },
    data: { isActive: false },
  });

  const virtualMeeting = await ensureAppointmentType({
    teacherId: teacher.id,
    name: 'Virtual Meeting',
    durationMinutes: 20,
    format: 'VIRTUAL',
    description: 'Video meeting. A Google Meet link is created when you book.',
  });

  const homeVisit = await ensureAppointmentType({
    teacherId: teacher.id,
    name: 'Home Visit',
    durationMinutes: 45,
    format: 'HOME_VISIT',
    description:
      'The teacher comes to the home with a coworker. Reminders go to the teacher and the parent.',
  });

  await prisma.availability.deleteMany({ where: { teacherId: teacher.id } });
  await prisma.availability.createMany({
    data: [1, 2, 3, 4].map((dayOfWeek) => ({
      teacherId: teacher.id,
      dayOfWeek,
      startTime: '15:30',
      endTime: '17:00',
    })),
  });

  await prisma.contactLog.deleteMany({ where: { teacherId: teacher.id } });
  await prisma.contactTask.deleteMany({ where: { teacherId: teacher.id } });
  await prisma.appointment.deleteMany({ where: { teacherId: teacher.id } });

  const today = calendarDateInTimeZone(TIME_ZONE).iso;
  const maya = people.get('Maya Rodriguez');
  const jordan = people.get('Jordan Lee');
  const alex = people.get('Alex Martinez');
  const sofia = people.get('Sofia Garcia');
  const ethan = people.get('Ethan Wilson');

  if (!maya || !jordan || !alex || !sofia || !ethan) {
    throw new Error('Demo families were not created');
  }

  const meetingStart = zonedWallTimeToUtc(TIME_ZONE, today, 10, 30);
  const callStart = zonedWallTimeToUtc(TIME_ZONE, today, 15, 30);
  const tomorrowStart = zonedWallTimeToUtc(TIME_ZONE, addDaysIso(today, 1), 16, 0);

  await prisma.appointment.createMany({
    data: [
      {
        teacherId: teacher.id,
        appointmentTypeId: virtualMeeting.id,
        studentId: maya.studentId,
        guardianId: maya.guardianId,
        startsAt: meetingStart,
        endsAt: new Date(meetingStart.getTime() + 20 * 60 * 1000),
        reason: 'Review missing homework',
      },
      {
        teacherId: teacher.id,
        appointmentTypeId: virtualMeeting.id,
        studentId: jordan.studentId,
        guardianId: jordan.guardianId,
        startsAt: callStart,
        endsAt: new Date(callStart.getTime() + 10 * 60 * 1000),
        reason: 'Follow-up from last week',
      },
      {
        teacherId: teacher.id,
        appointmentTypeId: homeVisit.id,
        studentId: sofia.studentId,
        guardianId: sofia.guardianId,
        startsAt: tomorrowStart,
        endsAt: new Date(tomorrowStart.getTime() + 20 * 60 * 1000),
        reason: 'Attendance check-in',
      },
    ],
  });

  const mayaTask = await prisma.contactTask.create({
    data: {
      teacherId: teacher.id,
      studentId: maya.studentId,
      guardianId: maya.guardianId,
      reason: 'ACADEMIC_CONCERN',
      priority: 'HIGH',
      status: 'ATTEMPTED',
      dueDate: dateOnlyUtc(addDaysIso(today, -3)),
      attemptCount: 1,
      lastContactAt: zonedWallTimeToUtc(TIME_ZONE, addDaysIso(today, -2), 16, 5),
      notes: 'Need to talk about missing homework.',
    },
  });

  await prisma.contactTask.createMany({
    data: [
      {
        teacherId: teacher.id,
        studentId: jordan.studentId,
        guardianId: jordan.guardianId,
        reason: 'MISSING_ASSIGNMENTS',
        priority: 'HIGH',
        status: 'NOT_CONTACTED',
        dueDate: dateOnlyUtc(today),
        notes: 'Three assignments still missing.',
      },
      {
        teacherId: teacher.id,
        studentId: alex.studentId,
        guardianId: alex.guardianId,
        reason: 'POSITIVE_UPDATE',
        priority: 'NORMAL',
        status: 'NOT_CONTACTED',
        dueDate: dateOnlyUtc(today),
        notes: 'Share improvement in class participation.',
      },
      {
        teacherId: teacher.id,
        studentId: sofia.studentId,
        guardianId: sofia.guardianId,
        reason: 'ATTENDANCE',
        priority: 'URGENT',
        status: 'FOLLOW_UP_REQUIRED',
        dueDate: dateOnlyUtc(addDaysIso(today, -1)),
        followUpDate: dateOnlyUtc(addDaysIso(today, -1)),
        attemptCount: 1,
        notes: 'Parent asked for a follow-up after the first call.',
      },
      {
        teacherId: teacher.id,
        studentId: ethan.studentId,
        guardianId: ethan.guardianId,
        reason: 'STUDENT_IMPROVEMENT',
        priority: 'NORMAL',
        status: 'COMPLETED',
        dueDate: dateOnlyUtc(addDaysIso(today, -5)),
        attemptCount: 1,
        lastContactAt: zonedWallTimeToUtc(TIME_ZONE, addDaysIso(today, -5), 17, 0),
        notes: 'Shared a positive update. No follow-up needed.',
      },
    ],
  });

  const ethanTask = await prisma.contactTask.findFirst({
    where: {
      teacherId: teacher.id,
      studentId: ethan.studentId,
      status: 'COMPLETED',
    },
  });
  const sofiaTask = await prisma.contactTask.findFirst({
    where: {
      teacherId: teacher.id,
      studentId: sofia.studentId,
    },
  });

  if (!ethanTask || !sofiaTask) {
    throw new Error('Demo contact tasks were not created');
  }

  await prisma.contactLog.createMany({
    data: [
      {
        teacherId: teacher.id,
        studentId: maya.studentId,
        contactTaskId: mayaTask.id,
        method: 'PHONE',
        outcome: 'LEFT_VOICEMAIL',
        notes: 'Left a voicemail about missing homework.',
        contactedAt: zonedWallTimeToUtc(TIME_ZONE, addDaysIso(today, -2), 16, 5),
      },
      {
        teacherId: teacher.id,
        studentId: sofia.studentId,
        contactTaskId: sofiaTask.id,
        method: 'PHONE',
        outcome: 'REACHED',
        notes: 'Discussed attendance. Parent asked for another check-in.',
        contactedAt: zonedWallTimeToUtc(TIME_ZONE, addDaysIso(today, -1), 18, 10),
      },
      {
        teacherId: teacher.id,
        studentId: ethan.studentId,
        contactTaskId: ethanTask.id,
        method: 'PHONE',
        outcome: 'REACHED',
        notes: 'Shared a positive update about class participation.',
        contactedAt: zonedWallTimeToUtc(TIME_ZONE, addDaysIso(today, -5), 17, 0),
      },
    ],
  });

  console.log('Seeded demo teacher: teacher@teacherconnect.dev / DemoPass123!');
  console.log('Seeded fictional dashboard data only. Never add real student data.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
