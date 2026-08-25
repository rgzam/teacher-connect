import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, MeetingFormat, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import {
  addDaysIso,
  calendarDateInTimeZone,
  dateOnlyUtc,
  dayRangeUtc,
} from '../common/datetime';
import { CalendarService } from '../calendar/calendar.service';
import {
  formatAppointmentWhen,
  parentCancellationEmail,
  parentConfirmationEmail,
  reminderEmail,
  teacherBookingEmail,
  teacherCancellationEmail,
} from '../email/booking-email';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { TeacherAccessService } from '../teacher/teacher-access.service';
import { generateSlotsForDate } from './generate-slots';
import { shouldSendReminder } from './should-remind';
import type {
  CreateAppointmentTypeDto,
  CreateBlockedDateDto,
  PublicBookDto,
  ReplaceAvailabilityDto,
  UpdateScheduleSettingsDto,
} from './dto/scheduling.dto';

@Injectable()
export class SchedulingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly teacherAccess: TeacherAccessService,
    private readonly calendarService: CalendarService,
    private readonly emailService: EmailService,
  ) {}

  async getTeacherSchedule(userId: string) {
    const teacher = await this.teacherAccess.requireTeacher(userId);
    return this.serializeSchedule(teacher.id);
  }

  async updateSettings(userId: string, dto: UpdateScheduleSettingsDto) {
    const teacher = await this.teacherAccess.requireTeacher(userId);
    await this.prisma.teacher.update({
      where: { id: teacher.id },
      data: {
        bufferMinutes: dto.bufferMinutes,
        minNoticeHours: dto.minNoticeHours,
        maxBookingDays: dto.maxBookingDays,
      },
    });
    return this.serializeSchedule(teacher.id);
  }

  async replaceAvailability(userId: string, dto: ReplaceAvailabilityDto) {
    const teacher = await this.teacherAccess.requireTeacher(userId);
    await this.prisma.$transaction([
      this.prisma.availability.deleteMany({ where: { teacherId: teacher.id } }),
      this.prisma.availability.createMany({
        data: dto.windows.map((window) => ({
          teacherId: teacher.id,
          dayOfWeek: window.dayOfWeek,
          startTime: window.startTime,
          endTime: window.endTime,
        })),
      }),
    ]);
    return this.serializeSchedule(teacher.id);
  }

  async createType(userId: string, dto: CreateAppointmentTypeDto) {
    const teacher = await this.teacherAccess.requireTeacher(userId);
    return this.prisma.appointmentType.create({
      data: {
        teacherId: teacher.id,
        name: dto.name.trim(),
        durationMinutes: dto.durationMinutes,
        description: dto.description?.trim() || null,
        format: dto.format,
      },
    });
  }

  async addBlockedDate(userId: string, dto: CreateBlockedDateDto) {
    const teacher = await this.teacherAccess.requireTeacher(userId);
    return this.prisma.blockedDate.create({
      data: {
        teacherId: teacher.id,
        date: dateOnlyUtc(dto.date.slice(0, 10)),
        reason: dto.reason?.trim() || null,
      },
    });
  }

  async listAppointments(userId: string) {
    const teacher = await this.teacherAccess.requireTeacher(userId);
    const appointments = await this.prisma.appointment.findMany({
      where: { teacherId: teacher.id, status: AppointmentStatus.CONFIRMED },
      include: { appointmentType: true, student: true, guardian: true },
      orderBy: { startsAt: 'asc' },
    });

    return {
      bookingSlug: teacher.bookingSlug,
      timezone: teacher.timezone,
      appointments: appointments.map((appointment) =>
        this.serializeAppointment(appointment),
      ),
    };
  }

  async cancelAppointment(userId: string, appointmentId: string) {
    const teacher = await this.teacherAccess.requireTeacher(userId);
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, teacherId: teacher.id },
      include: { appointmentType: true, guardian: true, student: true },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const updated = await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: AppointmentStatus.CANCELLED },
    });
    await this.calendarService.deleteBookingEvent(
      teacher.id,
      appointment.googleEventId,
    );

    await this.notifyCancellation(teacher, appointment);
    return updated;
  }

  async getPublicAppointment(token: string) {
    const appointment = await this.findByManageToken(token);
    return this.serializeAppointment(appointment, {
      includeManage: true,
      bookingSlug: appointment.teacher.bookingSlug,
      timezone: appointment.teacher.timezone,
    });
  }

  async cancelPublicAppointment(token: string) {
    const appointment = await this.findByManageToken(token);
    if (appointment.status !== AppointmentStatus.CONFIRMED) {
      throw new BadRequestException('This appointment is no longer active');
    }

    const updated = await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: AppointmentStatus.CANCELLED },
    });
    await this.calendarService.deleteBookingEvent(
      appointment.teacherId,
      appointment.googleEventId,
    );
    await this.notifyCancellation(appointment.teacher, appointment);
    return this.serializeAppointment(
      { ...appointment, ...updated },
      {
        includeManage: true,
        bookingSlug: appointment.teacher.bookingSlug,
        timezone: appointment.teacher.timezone,
      },
    );
  }

  async reschedulePublicAppointment(token: string, startsAtIso: string) {
    const appointment = await this.findByManageToken(token);
    if (appointment.status !== AppointmentStatus.CONFIRMED) {
      throw new BadRequestException('This appointment is no longer active');
    }

    const teacher = appointment.teacher;
    const type = appointment.appointmentType;
    const startsAt = new Date(startsAtIso);
    const days = await this.buildBookableDays(
      teacher,
      type.durationMinutes,
      appointment.id,
    );
    const allowed = days
      .flatMap((day) => day.slots)
      .some((slot) => new Date(slot.startsAt).getTime() === startsAt.getTime());

    if (!allowed) {
      throw new ConflictException('That time is no longer available');
    }

    const endsAt = new Date(startsAt.getTime() + type.durationMinutes * 60 * 1000);
    await this.calendarService.deleteBookingEvent(
      teacher.id,
      appointment.googleEventId,
    );
    const googleEvent = await this.calendarService.createBookingEvent({
      teacherId: teacher.id,
      summary: `${type.name} — TeacherConnect`,
      startsAt,
      endsAt,
      timeZone: teacher.timezone,
      createMeet: type.format === MeetingFormat.VIRTUAL,
    });

    const updated = await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        startsAt,
        endsAt,
        reminderSentAt: null,
        googleEventId: googleEvent?.eventId ?? null,
        meetUrl: googleEvent?.meetUrl ?? null,
      },
      include: { appointmentType: true, guardian: true, student: true, teacher: true },
    });

    await this.sendBookingEmails(teacher, updated);
    return this.serializeAppointment(updated, {
      includeManage: true,
      bookingSlug: teacher.bookingSlug,
      timezone: teacher.timezone,
    });
  }

  async getPublicTeacher(slug: string) {
    const teacher = await this.findPublicTeacher(slug);
    const types = await this.prisma.appointmentType.findMany({
      where: { teacherId: teacher.id, isActive: true },
      orderBy: { durationMinutes: 'asc' },
    });

    return {
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      schoolName: teacher.schoolName,
      timezone: teacher.timezone,
      bookingSlug: teacher.bookingSlug,
      types: types.map((type) => this.serializeType(type)),
    };
  }

  async getPublicSlots(slug: string, typeId: string) {
    const teacher = await this.findPublicTeacher(slug);
    const type = await this.prisma.appointmentType.findFirst({
      where: { id: typeId, teacherId: teacher.id, isActive: true },
    });

    if (!type) {
      throw new NotFoundException('Appointment type not found');
    }

    const days = await this.buildBookableDays(teacher, type.durationMinutes);
    return {
      timezone: teacher.timezone,
      type: this.serializeType(type),
      days,
    };
  }

  async bookPublic(slug: string, dto: PublicBookDto) {
    const teacher = await this.findPublicTeacher(slug);
    const type = await this.prisma.appointmentType.findFirst({
      where: { id: dto.appointmentTypeId, teacherId: teacher.id, isActive: true },
    });

    if (!type) {
      throw new NotFoundException('Appointment type not found');
    }

    const startsAt = new Date(dto.startsAt);
    const days = await this.buildBookableDays(teacher, type.durationMinutes);
    const allowed = days
      .flatMap((day) => day.slots)
      .some((slot) => new Date(slot.startsAt).getTime() === startsAt.getTime());

    if (!allowed) {
      throw new ConflictException('That time is no longer available');
    }

    const endsAt = new Date(startsAt.getTime() + type.durationMinutes * 60 * 1000);

    try {
      const appointment = await this.prisma.$transaction(async (tx) => {
        let guardian = dto.guardianEmail
          ? await tx.guardian.findFirst({
              where: { teacherId: teacher.id, email: dto.guardianEmail },
            })
          : null;

        if (!guardian) {
          guardian = await tx.guardian.create({
            data: {
              teacherId: teacher.id,
              firstName: dto.guardianFirstName.trim(),
              lastName: dto.guardianLastName.trim(),
              email: dto.guardianEmail?.trim() || null,
              phone: dto.guardianPhone?.trim() || null,
            },
          });
        } else if (dto.guardianPhone?.trim() && !guardian.phone) {
          guardian = await tx.guardian.update({
            where: { id: guardian.id },
            data: { phone: dto.guardianPhone.trim() },
          });
        }

        const student =
          (await tx.student.findFirst({
            where: {
              teacherId: teacher.id,
              firstName: dto.studentFirstName.trim(),
              lastName: dto.studentLastName.trim(),
            },
          })) ??
          (await tx.student.create({
            data: {
              teacherId: teacher.id,
              firstName: dto.studentFirstName.trim(),
              lastName: dto.studentLastName.trim(),
            },
          }));

        await tx.studentGuardian.upsert({
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
          },
        });

        return tx.appointment.create({
          data: {
            teacherId: teacher.id,
            appointmentTypeId: type.id,
            guardianId: guardian.id,
            studentId: student.id,
            startsAt,
            endsAt,
            reason: dto.reason?.trim() || null,
            homeVisitAddress: dto.homeVisitAddress?.trim() || null,
            manageToken: randomBytes(24).toString('base64url'),
            status: AppointmentStatus.CONFIRMED,
          },
          include: { appointmentType: true, guardian: true, student: true },
        });
      });

      const googleEvent = await this.calendarService.createBookingEvent({
        teacherId: teacher.id,
        summary: `${type.name} — TeacherConnect`,
        startsAt,
        endsAt,
        timeZone: teacher.timezone,
        createMeet: type.format === MeetingFormat.VIRTUAL,
      });

      const saved = googleEvent?.eventId
        ? await this.prisma.appointment.update({
            where: { id: appointment.id },
            data: {
              googleEventId: googleEvent.eventId,
              meetUrl: googleEvent.meetUrl,
            },
            include: { appointmentType: true, guardian: true, student: true },
          })
        : appointment;

      await this.sendBookingEmails(teacher, saved);

      return this.serializeAppointment(saved, {
        includeManage: true,
        bookingSlug: teacher.bookingSlug,
        timezone: teacher.timezone,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'That time was just booked. Please pick another slot.',
        );
      }
      throw error;
    }
  }

  private async findByManageToken(token: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { manageToken: token },
      include: {
        appointmentType: true,
        guardian: true,
        student: true,
        teacher: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  private async notifyCancellation(
    teacher: { userId: string; firstName: string; lastName: string; timezone: string },
    appointment: {
      startsAt: Date;
      appointmentType: { name: string; format: MeetingFormat };
      guardian: {
        firstName: string;
        lastName: string;
        email: string | null;
        phone: string | null;
      } | null;
      student: { firstName: string; lastName: string } | null;
      meetUrl?: string | null;
      homeVisitAddress?: string | null;
      manageToken?: string;
    },
  ) {
    const details = this.toEmailDetails(teacher, appointment);
    if (appointment.guardian?.email) {
      void this.emailService.send({
        to: appointment.guardian.email,
        ...parentCancellationEmail(details),
      });
    }

    const teacherUser = await this.prisma.user.findUnique({
      where: { id: teacher.userId },
      select: { email: true },
    });
    if (teacherUser?.email) {
      void this.emailService.send({
        to: teacherUser.email,
        ...teacherCancellationEmail(details),
      });
    }
  }

  private async findPublicTeacher(slug: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { bookingSlug: slug },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return teacher;
  }

  private async buildBookableDays(
    teacher: {
      id: string;
      timezone: string;
      bufferMinutes: number;
      minNoticeHours: number;
      maxBookingDays: number;
    },
    durationMinutes: number,
    exceptAppointmentId?: string,
  ) {
    const today = calendarDateInTimeZone(teacher.timezone).iso;
    const rangeStart = dayRangeUtc(teacher.timezone, today).start;
    const rangeEnd = dayRangeUtc(
      teacher.timezone,
      addDaysIso(today, teacher.maxBookingDays),
    ).end;

    const [windows, blockedDates, appointments, googleBusy] = await Promise.all([
      this.prisma.availability.findMany({ where: { teacherId: teacher.id } }),
      this.prisma.blockedDate.findMany({ where: { teacherId: teacher.id } }),
      this.prisma.appointment.findMany({
        where: {
          teacherId: teacher.id,
          status: AppointmentStatus.CONFIRMED,
          ...(exceptAppointmentId ? { id: { not: exceptAppointmentId } } : {}),
        },
        select: { startsAt: true, endsAt: true },
      }),
      this.calendarService.getBusyRanges(teacher.id, rangeStart, rangeEnd),
    ]);

    const blocked = new Set(
      blockedDates.map((item) => item.date.toISOString().slice(0, 10)),
    );
    const now = new Date();
    const minNoticeAt = new Date(
      now.getTime() + teacher.minNoticeHours * 60 * 60 * 1000,
    );
    const days = [];

    for (let offset = 0; offset < teacher.maxBookingDays; offset += 1) {
      const isoDate = addDaysIso(today, offset);
      const { start, end } = dayRangeUtc(teacher.timezone, isoDate);
      const busy = [...appointments, ...googleBusy].filter(
        (item) => item.startsAt < end && item.endsAt > start,
      );
      const slots = generateSlotsForDate({
        isoDate,
        timeZone: teacher.timezone,
        windows,
        durationMinutes,
        bufferMinutes: teacher.bufferMinutes,
        minNoticeAt,
        busy,
        blocked: blocked.has(isoDate),
      });

      if (slots.length > 0) {
        days.push({
          date: isoDate,
          slots: slots.map((slot) => ({
            startsAt: slot.startsAt.toISOString(),
            endsAt: slot.endsAt.toISOString(),
          })),
        });
      }
    }

    return days;
  }

  private async serializeSchedule(teacherId: string) {
    const teacher = await this.prisma.teacher.findUniqueOrThrow({
      where: { id: teacherId },
      include: {
        availability: { orderBy: { dayOfWeek: 'asc' } },
        appointmentTypes: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
        blockedDates: { orderBy: { date: 'asc' } },
      },
    });

    return {
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      timezone: teacher.timezone,
      bookingSlug: teacher.bookingSlug,
      bufferMinutes: teacher.bufferMinutes,
      minNoticeHours: teacher.minNoticeHours,
      maxBookingDays: teacher.maxBookingDays,
      windows: teacher.availability.map((window) => ({
        dayOfWeek: window.dayOfWeek,
        startTime: window.startTime,
        endTime: window.endTime,
      })),
      types: teacher.appointmentTypes.map((type) => this.serializeType(type)),
      blockedDates: teacher.blockedDates.map((item) => ({
        id: item.id,
        date: item.date.toISOString().slice(0, 10),
        reason: item.reason,
      })),
      calendar: await this.calendarService.getStatus(teacher.id),
    };
  }

  private async sendBookingEmails(
    teacher: { userId: string; firstName: string; lastName: string; timezone: string },
    appointment: {
      startsAt: Date;
      appointmentType: { name: string; format: MeetingFormat };
      guardian: {
        firstName: string;
        lastName: string;
        email: string | null;
        phone?: string | null;
      } | null;
      student: { firstName: string; lastName: string } | null;
      meetUrl?: string | null;
      homeVisitAddress?: string | null;
      manageToken?: string;
    },
  ) {
    const details = this.toEmailDetails(teacher, appointment);
    if (appointment.guardian?.email) {
      const email = parentConfirmationEmail(details);
      void this.emailService.send({ to: appointment.guardian.email, ...email });
    }

    const teacherUser = await this.prisma.user.findUnique({
      where: { id: teacher.userId },
      select: { email: true },
    });
    if (teacherUser?.email) {
      const email = teacherBookingEmail(details);
      void this.emailService.send({ to: teacherUser.email, ...email });
    }
  }

  private toEmailDetails(
    teacher: { firstName: string; lastName: string; timezone: string },
    appointment: {
      startsAt: Date;
      appointmentType: { name: string; format: MeetingFormat };
      guardian: {
        firstName: string;
        lastName: string;
        phone?: string | null;
      } | null;
      student: { firstName: string; lastName: string } | null;
      meetUrl?: string | null;
      homeVisitAddress?: string | null;
      manageToken?: string;
    },
  ) {
    return {
      teacherName: `${teacher.firstName} ${teacher.lastName}`,
      typeName: appointment.appointmentType.name,
      whenLabel: formatAppointmentWhen(appointment.startsAt, teacher.timezone),
      guardianName: appointment.guardian
        ? `${appointment.guardian.firstName} ${appointment.guardian.lastName}`
        : 'A parent',
      guardianPhone: appointment.guardian?.phone ?? null,
      studentName: appointment.student
        ? `${appointment.student.firstName} ${appointment.student.lastName}`
        : null,
      format: appointment.appointmentType.format,
      meetUrl: appointment.meetUrl ?? null,
      homeVisitAddress: appointment.homeVisitAddress ?? null,
      manageUrl: appointment.manageToken
        ? this.manageUrl(appointment.manageToken)
        : null,
    };
  }

  private manageUrl(token: string) {
    const base = (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(
      /\/$/,
      '',
    );
    return `${base}/manage/${token}`;
  }

  async sendDueReminders(now = new Date()) {
    const windowEnd = new Date(now.getTime() + 60 * 60 * 1000);
    const appointments = await this.prisma.appointment.findMany({
      where: {
        status: AppointmentStatus.CONFIRMED,
        reminderSentAt: null,
        startsAt: { gt: now, lte: windowEnd },
      },
      include: {
        appointmentType: true,
        guardian: true,
        student: true,
        teacher: true,
      },
    });

    for (const appointment of appointments) {
      if (
        !shouldSendReminder(
          appointment.startsAt,
          now,
          appointment.reminderSentAt,
        )
      ) {
        continue;
      }

      const details = this.toEmailDetails(appointment.teacher, appointment);
      if (appointment.guardian?.email) {
        void this.emailService.send({
          to: appointment.guardian.email,
          ...reminderEmail(details, false),
        });
      }

      const teacherUser = await this.prisma.user.findUnique({
        where: { id: appointment.teacher.userId },
        select: { email: true },
      });
      if (teacherUser?.email) {
        void this.emailService.send({
          to: teacherUser.email,
          ...reminderEmail(details, true),
        });
      }

      await this.prisma.appointment.update({
        where: { id: appointment.id },
        data: { reminderSentAt: now },
      });
    }

    return appointments.length;
  }

  private serializeType(type: {
    id: string;
    name: string;
    durationMinutes: number;
    description: string | null;
    format: MeetingFormat;
  }) {
    return {
      id: type.id,
      name: type.name,
      durationMinutes: type.durationMinutes,
      description: type.description,
      format: type.format,
    };
  }

  private serializeAppointment(
    appointment: {
      id: string;
      startsAt: Date;
      endsAt: Date;
      status: AppointmentStatus;
      reason: string | null;
      virtualMeetingName?: string | null;
      meetUrl?: string | null;
      manageToken?: string;
      homeVisitAddress?: string | null;
      appointmentType: {
        id: string;
        name: string;
        durationMinutes: number;
        format: MeetingFormat;
      };
      student: { firstName: string; lastName: string } | null;
      guardian: { firstName: string; lastName: string } | null;
    },
    options?: {
      includeManage?: boolean;
      bookingSlug?: string;
      timezone?: string;
    },
  ) {
    return {
      id: appointment.id,
      startsAt: appointment.startsAt.toISOString(),
      endsAt: appointment.endsAt.toISOString(),
      status: appointment.status,
      reason: appointment.reason,
      typeName: appointment.appointmentType.name,
      appointmentTypeId: appointment.appointmentType.id,
      format: appointment.appointmentType.format,
      durationMinutes: appointment.appointmentType.durationMinutes,
      studentName: appointment.student
        ? `${appointment.student.firstName} ${appointment.student.lastName}`
        : null,
      guardianName: appointment.guardian
        ? `${appointment.guardian.firstName} ${appointment.guardian.lastName}`
        : null,
      virtualMeetingName: appointment.virtualMeetingName ?? null,
      meetUrl: appointment.meetUrl ?? null,
      homeVisitAddress: appointment.homeVisitAddress ?? null,
      ...(options?.includeManage && appointment.manageToken
        ? { manageToken: appointment.manageToken }
        : {}),
      ...(options?.bookingSlug ? { bookingSlug: options.bookingSlug } : {}),
      ...(options?.timezone ? { timezone: options.timezone } : {}),
    };
  }
}
