import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeacherAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async requireTeacher(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { teacher: true },
    });

    if (!user?.teacher) {
      throw new ForbiddenException('Teacher profile required');
    }

    return user.teacher;
  }
}
