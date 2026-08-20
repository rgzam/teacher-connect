import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { HealthResponse } from '@teacher-connect/types';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOkResponse({ description: 'API and database are reachable' })
  async getHealth(): Promise<HealthResponse> {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      service: 'teacher-connect-api',
      timestamp: new Date().toISOString(),
    };
  }
}
