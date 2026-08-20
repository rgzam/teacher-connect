import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
          },
        },
      ],
    }).compile();

    controller = module.get(HealthController);
  });

  it('returns ok when the database ping succeeds', async () => {
    const result = await controller.getHealth();

    expect(result.status).toBe('ok');
    expect(result.service).toBe('teacher-connect-api');
    expect(result.timestamp).toBeDefined();
  });
});
