import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  AppointmentStatus,
  ContactPriority,
  ContactStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  addDaysIso,
  calendarDateInTimeZone,
  dateOnlyUtc,
  dayRangeUtc,
} from '../common/datetime';

const OPEN_CONTACT_STATUSES: ContactStatus[] = [
  ContactStatus.NOT_CONTACTED,
  ContactStatus.ATTEMPTED,
  ContactStatus.REACHED,
  ContactStatus.FOLLOW_UP_REQUIRED,
];

const PRIORITY_RANK: Record<ContactPriority, number> = {
  URGENT: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3,
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { teacher: true },
    });

    if (!user?.teacher) {
      throw new ForbiddenException('Teacher profile required');
    }

    const teacher = user.teacher;
    const timeZone = teacher.timezone;
    const today = calendarDateInTimeZone(timeZone);
    const todayDate = dateOnlyUtc(today.iso);
    const { start: dayStart, end: dayEnd } = dayRangeUtc(timeZone, today.iso);
    const upcomingEnd = zonedEndOfDay(
      timeZone,
      addDaysIso(today.iso, 14),
    );

    const [todayAppointments, upcomingAppointments, openTasks, recentLogs] =
      await Promise.all([
        this.prisma.appointment.findMany({
          where: {
            teacherId: teacher.id,
            status: AppointmentStatus.CONFIRMED,
            startsAt: { gte: dayStart, lt: dayEnd },
          },
          include: {
            appointmentType: true,
            student: true,
            guardian: true,
          },
          orderBy: { startsAt: 'asc' },
        }),
        this.prisma.appointment.findMany({
          where: {
            teacherId: teacher.id,
            status: AppointmentStatus.CONFIRMED,
            startsAt: { gte: dayEnd, lt: upcomingEnd },
          },
          include: {
            appointmentType: true,
            student: true,
            guardian: true,
          },
          orderBy: { startsAt: 'asc' },
          take: 5,
        }),
        this.prisma.contactTask.findMany({
          where: {
            teacherId: teacher.id,
            status: { in: OPEN_CONTACT_STATUSES },
          },
          include: {
            student: true,
            guardian: true,
          },
        }),
        this.prisma.contactLog.findMany({
          where: { teacherId: teacher.id },
          include: { student: true },
          orderBy: { contactedAt: 'desc' },
          take: 5,
        }),
      ]);

    const callsToMake = openTasks.filter(
      (task) => sameDate(task.dueDate, todayDate) || sameDate(task.followUpDate, todayDate),
    );
    const overdueFollowUps = openTasks.filter(
      (task) =>
        isBeforeDate(task.dueDate, todayDate) || isBeforeDate(task.followUpDate, todayDate),
    );
    const highPriority = openTasks.filter(
      (task) =>
        task.priority === ContactPriority.HIGH ||
        task.priority === ContactPriority.URGENT,
    );

    const contactQueue = [...openTasks].sort((left, right) => {
      const priorityDiff = PRIORITY_RANK[left.priority] - PRIORITY_RANK[right.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      return left.dueDate.getTime() - right.dueDate.getTime();
    });

    return {
      teacher: {
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        timezone: timeZone,
      },
      date: today.iso,
      counts: {
        appointmentsToday: todayAppointments.length,
        callsToMake: callsToMake.length,
        overdueFollowUps: overdueFollowUps.length,
        highPriority: highPriority.length,
      },
      todayAppointments: todayAppointments.map((appointment) =>
        this.serializeAppointment(appointment),
      ),
      upcomingAppointments: upcomingAppointments.map((appointment) =>
        this.serializeAppointment(appointment),
      ),
      contactQueue: contactQueue.map((task) => this.serializeTask(task, todayDate)),
      recentActivity: recentLogs.map((log) => ({
        id: log.id,
        contactedAt: log.contactedAt.toISOString(),
        method: log.method,
        outcome: log.outcome,
        notes: log.notes,
        studentName: `${log.student.firstName} ${log.student.lastName}`,
      })),
    };
  }

  private serializeAppointment(appointment: {
    id: string;
    startsAt: Date;
    endsAt: Date;
    reason: string | null;
    appointmentType: { name: string };
    student: { firstName: string; lastName: string } | null;
    guardian: { firstName: string; lastName: string } | null;
  }) {
    return {
      id: appointment.id,
      startsAt: appointment.startsAt.toISOString(),
      endsAt: appointment.endsAt.toISOString(),
      typeName: appointment.appointmentType.name,
      reason: appointment.reason,
      studentName: appointment.student
        ? `${appointment.student.firstName} ${appointment.student.lastName}`
        : null,
      guardianName: appointment.guardian
        ? `${appointment.guardian.firstName} ${appointment.guardian.lastName}`
        : null,
    };
  }

  private serializeTask(
    task: {
      id: string;
      reason: string;
      priority: ContactPriority;
      status: ContactStatus;
      dueDate: Date;
      followUpDate: Date | null;
      student: { firstName: string; lastName: string };
      guardian: { firstName: string; lastName: string } | null;
    },
    todayDate: Date,
  ) {
    return {
      id: task.id,
      reason: task.reason,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate.toISOString(),
      followUpDate: task.followUpDate?.toISOString() ?? null,
      isOverdue:
        isBeforeDate(task.dueDate, todayDate) ||
        isBeforeDate(task.followUpDate, todayDate),
      studentName: `${task.student.firstName} ${task.student.lastName}`,
      guardianName: task.guardian
        ? `${task.guardian.firstName} ${task.guardian.lastName}`
        : `${task.student.firstName}'s parent`,
    };
  }
}

function sameDate(value: Date | null, today: Date) {
  return Boolean(value && value.getTime() === today.getTime());
}

function isBeforeDate(value: Date | null, today: Date) {
  return Boolean(value && value.getTime() < today.getTime());
}

function zonedEndOfDay(timeZone: string, isoDate: string) {
  const { end } = dayRangeUtc(timeZone, isoDate);
  return end;
}
