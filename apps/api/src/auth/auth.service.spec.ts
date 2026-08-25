import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: { findUnique: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn().mockResolvedValue('test-token') },
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('rejects unknown emails with the same message as a bad password', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({ email: 'missing@example.com', password: 'DemoPass123!' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns a public user and never includes the password hash', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'teacher@teacherconnect.dev',
      passwordHash: await hash('DemoPass123!', 10),
      role: 'TEACHER',
      teacher: {
        id: 'teacher-1',
        firstName: 'Ly',
        lastName: 'Le',
        bookingSlug: 'ly-le',
      },
    });

    const result = await service.login({
      email: 'teacher@teacherconnect.dev',
      password: 'DemoPass123!',
    });

    expect(result.token).toBe('test-token');
    expect(result.user.email).toBe('teacher@teacherconnect.dev');
    expect(result.user).not.toHaveProperty('passwordHash');
  });
});
