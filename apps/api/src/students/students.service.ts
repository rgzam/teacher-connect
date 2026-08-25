import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TeacherAccessService } from '../teacher/teacher-access.service';
import type { CreateStudentDto } from './dto/create-student.dto';

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly teacherAccess: TeacherAccessService,
  ) {}

  async list(userId: string) {
    const teacher = await this.teacherAccess.requireTeacher(userId);

    const students = await this.prisma.student.findMany({
      where: { teacherId: teacher.id },
      include: {
        guardians: { include: { guardian: true } },
        contactTasks: {
          where: { status: { not: 'COMPLETED' } },
          select: { id: true },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    return students.map((student) => this.serializeStudent(student));
  }

  async getOne(userId: string, studentId: string) {
    const teacher = await this.teacherAccess.requireTeacher(userId);
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, teacherId: teacher.id },
      include: {
        guardians: { include: { guardian: true } },
        contactTasks: {
          include: { guardian: true },
          orderBy: { dueDate: 'asc' },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return this.serializeStudent(student, true);
  }

  async create(userId: string, dto: CreateStudentDto) {
    const teacher = await this.teacherAccess.requireTeacher(userId);

    const student = await this.prisma.$transaction(async (tx) => {
      const created = await tx.student.create({
        data: {
          teacherId: teacher.id,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          notes: dto.notes?.trim() || null,
        },
      });

      if (dto.guardian) {
        const guardian = await tx.guardian.create({
          data: {
            teacherId: teacher.id,
            firstName: dto.guardian.firstName.trim(),
            lastName: dto.guardian.lastName.trim(),
            email: dto.guardian.email?.trim() || null,
            phone: dto.guardian.phone?.trim() || null,
          },
        });

        await tx.studentGuardian.create({
          data: {
            studentId: created.id,
            guardianId: guardian.id,
            relationship: 'GUARDIAN',
          },
        });
      }

      return tx.student.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          guardians: { include: { guardian: true } },
          contactTasks: true,
        },
      });
    });

    return this.serializeStudent(student);
  }

  private serializeStudent(
    student: {
      id: string;
      firstName: string;
      lastName: string;
      notes: string | null;
      guardians: { guardian: { id: string; firstName: string; lastName: string; email: string | null; phone: string | null } }[];
      contactTasks: { id: string; reason?: string; priority?: string; status?: string; dueDate?: Date }[];
    },
    includeTasks = false,
  ) {
    return {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      notes: student.notes,
      openTaskCount: student.contactTasks.filter((task) =>
        includeTasks ? task.status !== 'COMPLETED' : true,
      ).length,
      guardians: student.guardians.map(({ guardian }) => ({
        id: guardian.id,
        firstName: guardian.firstName,
        lastName: guardian.lastName,
        email: guardian.email,
        phone: guardian.phone,
      })),
      tasks: includeTasks
        ? student.contactTasks.map((task) => ({
            id: task.id,
            reason: task.reason,
            priority: task.priority,
            status: task.status,
            dueDate: task.dueDate?.toISOString() ?? null,
          }))
        : undefined,
    };
  }
}
