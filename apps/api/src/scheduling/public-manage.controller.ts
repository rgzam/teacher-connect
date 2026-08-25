import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ReschedulePublicDto } from './dto/scheduling.dto';
import { SchedulingService } from './scheduling.service';

@ApiTags('public-booking')
@Controller('public/appointments')
export class PublicManageController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Get(':token')
  getAppointment(@Param('token') token: string) {
    return this.schedulingService.getPublicAppointment(token);
  }

  @Post(':token/cancel')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  cancel(@Param('token') token: string) {
    return this.schedulingService.cancelPublicAppointment(token);
  }

  @Patch(':token/reschedule')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  reschedule(
    @Param('token') token: string,
    @Body() dto: ReschedulePublicDto,
  ) {
    return this.schedulingService.reschedulePublicAppointment(
      token,
      dto.startsAt,
    );
  }
}
