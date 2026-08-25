import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: {
    user: { findUnique: jest.Mock };
    appointment: { findMany: jest.Mock };
    contactTask: { findMany: jest.Mock };
    contactLog: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      appointment: { findMany: jest.fn().mockResolvedValue([]) },
      contactTask: { findMany: jest.fn().mockResolvedValue([]) },
      contactLog: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(DashboardService);
  });

  it('rejects a user without a teacher profile', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', teacher: null });

    await expect(service.getDashboard('user-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('queries appointments and tasks only for the logged-in teacher', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      teacher: {
        id: 'teacher-1',
        firstName: 'Ly',
        lastName: 'Le',
        timezone: 'America/Denver',
      },
    });

    await service.getDashboard('user-1');

    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ teacherId: 'teacher-1' }),
      }),
    );
    expect(prisma.contactTask.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ teacherId: 'teacher-1' }),
      }),
    );
  });
});
