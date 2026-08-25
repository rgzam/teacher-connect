import { Global, Module } from '@nestjs/common';
import { TeacherAccessService } from '../teacher/teacher-access.service';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService, TeacherAccessService],
  exports: [PrismaService, TeacherAccessService],
})
export class PrismaModule {}
