import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import type { LoginDto } from './dto/login.dto';
import type { PublicUser } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<{ user: PublicUser; token: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { teacher: true },
    });

    const passwordMatches = user
      ? await compare(dto.password, user.passwordHash)
      : false;

    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: this.toPublicUser(user),
    };
  }

  async getMe(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { teacher: true },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return this.toPublicUser(user);
  }

  private toPublicUser(user: {
    id: string;
    email: string;
    role: PublicUser['role'];
    teacher: {
      id: string;
      firstName: string;
      lastName: string;
      bookingSlug: string;
    } | null;
  }): PublicUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      teacher: user.teacher
        ? {
            id: user.teacher.id,
            firstName: user.teacher.firstName,
            lastName: user.teacher.lastName,
            bookingSlug: user.teacher.bookingSlug,
          }
        : null,
    };
  }
}
