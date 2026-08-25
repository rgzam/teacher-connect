import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContactMethod,
  ContactOutcome,
  ContactStatus,
} from '@prisma/client';
import { dateOnlyUtc } from '../common/datetime';
import { PrismaService } from '../prisma/prisma.service';
import { TeacherAccessService } from '../teacher/teacher-access.service';
import type { CreateContactTaskDto } from './dto/create-contact-task.dto';
import type { RecordContactDto } from './dto/record-contact.dto';

const OPEN_STATUSES: ContactStatus[] = [
  ContactStatus.NOT_CONTACTED,
  ContactStatus.ATTEMPTED,
  ContactStatus.REACHED,
  ContactStatus.FOLLOW_UP_REQUIRED,
];

@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly teacherAccess: TeacherAccessService,
  ) {}

  async list(userId: string, includeCompleted = false) {
    const teacher = await this.teacherAccess.requireTeacher(userId);
    const tasks = await this.prisma.contactTask.findMany({
      where: {
        teacherId: teacher.id,
        ...(includeCompleted ? {} : { status: { in: OPEN_STATUSES } }),
      },
      include: { student: true, guardian: true },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });

    return tasks.map((task) => this.serializeTask(task));
  }

  async getOne(userId: string, taskId: string) {
    const teacher = await this.teacherAccess.requireTeacher(userId);
    const task = await this.findOwnedTask(teacher.id, taskId);

    return this.serializeTask(task, true);
  }

  async create(userId: string, dto: CreateContactTaskDto) {
    const teacher = await this.teacherAccess.requireTeacher(userId);
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, teacherId: teacher.id },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (dto.guardianId) {
      const guardian = await this.prisma.guardian.findFirst({
        where: { id: dto.guardianId, teacherId: teacher.id },
      });
      if (!guardian) {
        throw new NotFoundException('Guardian not found');
      }
    }

    const task = await this.prisma.contactTask.create({
      data: {
        teacherId: teacher.id,
        studentId: student.id,
        guardianId: dto.guardianId ?? null,
        reason: dto.reason,
        priority: dto.priority,
        dueDate: dateOnlyUtc(dto.dueDate.slice(0, 10)),
        notes: dto.notes?.trim() || null,
      },
      include: { student: true, guardian: true },
    });

    return this.serializeTask(task);
  }

  async recordAttempt(userId: string, taskId: string, dto: RecordContactDto) {
    const teacher = await this.teacherAccess.requireTeacher(userId);
    const task = await this.findOwnedTask(teacher.id, taskId);

    if (task.status === ContactStatus.COMPLETED) {
      throw new BadRequestException('Completed contacts cannot be updated');
    }

    const nextStatus = nextContactStatus(dto);
    const now = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.contactLog.create({
        data: {
          teacherId: teacher.id,
          studentId: task.studentId,
          contactTaskId: task.id,
          method: dto.method,
          outcome: dto.outcome,
          notes: dto.notes?.trim() || null,
          contactedAt: now,
        },
      });

      return tx.contactTask.update({
        where: { id: task.id },
        data: {
          status: nextStatus,
          attemptCount: { increment: 1 },
          lastContactAt: now,
          followUpDate: dto.followUpDate
            ? dateOnlyUtc(dto.followUpDate.slice(0, 10))
            : dto.complete
              ? null
              : task.followUpDate,
          notes: dto.notes?.trim() || task.notes,
        },
        include: {
          student: true,
          guardian: true,
          logs: { orderBy: { contactedAt: 'desc' } },
        },
      });
    });

    return this.serializeTask(updated, true);
  }

  private async findOwnedTask(teacherId: string, taskId: string) {
    const task = await this.prisma.contactTask.findFirst({
      where: { id: taskId, teacherId },
      include: {
        student: true,
        guardian: true,
        logs: { orderBy: { contactedAt: 'desc' } },
      },
    });

    if (!task) {
      throw new NotFoundException('Contact task not found');
    }

    return task;
  }

  private serializeTask(
    task: {
      id: string;
      reason: string;
      priority: string;
      status: string;
      dueDate: Date;
      followUpDate: Date | null;
      attemptCount: number;
      lastContactAt: Date | null;
      notes: string | null;
      student: { id: string; firstName: string; lastName: string };
      guardian: { id: string; firstName: string; lastName: string } | null;
      logs?: {
        id: string;
        method: ContactMethod;
        outcome: ContactOutcome;
        notes: string | null;
        contactedAt: Date;
      }[];
    },
    includeLogs = false,
  ) {
    return {
      id: task.id,
      reason: task.reason,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate.toISOString(),
      followUpDate: task.followUpDate?.toISOString() ?? null,
      attemptCount: task.attemptCount,
      lastContactAt: task.lastContactAt?.toISOString() ?? null,
      notes: task.notes,
      student: {
        id: task.student.id,
        firstName: task.student.firstName,
        lastName: task.student.lastName,
      },
      guardian: task.guardian
        ? {
            id: task.guardian.id,
            firstName: task.guardian.firstName,
            lastName: task.guardian.lastName,
          }
        : null,
      logs: includeLogs
        ? (task.logs ?? []).map((log) => ({
            id: log.id,
            method: log.method,
            outcome: log.outcome,
            notes: log.notes,
            contactedAt: log.contactedAt.toISOString(),
          }))
        : undefined,
    };
  }
}

export function nextContactStatus(dto: RecordContactDto): ContactStatus {
  if (dto.complete) {
    return ContactStatus.COMPLETED;
  }

  if (dto.followUpDate) {
    return ContactStatus.FOLLOW_UP_REQUIRED;
  }

  if (dto.outcome === ContactOutcome.REACHED) {
    return ContactStatus.REACHED;
  }

  return ContactStatus.ATTEMPTED;
}
