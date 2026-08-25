import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthJwtPayload } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateAppointmentTypeDto,
  CreateBlockedDateDto,
  ReplaceAvailabilityDto,
  UpdateScheduleSettingsDto,
} from './dto/scheduling.dto';
import { SchedulingService } from './scheduling.service';

@ApiTags('scheduling')
@Controller()
@UseGuards(JwtAuthGuard)
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Get('scheduling')
  getSchedule(@CurrentUser() user: AuthJwtPayload) {
    return this.schedulingService.getTeacherSchedule(user.userId);
  }

  @Put('scheduling/settings')
  updateSettings(
    @CurrentUser() user: AuthJwtPayload,
    @Body() dto: UpdateScheduleSettingsDto,
  ) {
    return this.schedulingService.updateSettings(user.userId, dto);
  }

  @Put('scheduling/availability')
  replaceAvailability(
    @CurrentUser() user: AuthJwtPayload,
    @Body() dto: ReplaceAvailabilityDto,
  ) {
    return this.schedulingService.replaceAvailability(user.userId, dto);
  }

  @Post('scheduling/types')
  createType(
    @CurrentUser() user: AuthJwtPayload,
    @Body() dto: CreateAppointmentTypeDto,
  ) {
    return this.schedulingService.createType(user.userId, dto);
  }

  @Post('scheduling/blocked-dates')
  addBlockedDate(
    @CurrentUser() user: AuthJwtPayload,
    @Body() dto: CreateBlockedDateDto,
  ) {
    return this.schedulingService.addBlockedDate(user.userId, dto);
  }

  @Get('appointments')
  listAppointments(@CurrentUser() user: AuthJwtPayload) {
    return this.schedulingService.listAppointments(user.userId);
  }

  @Patch('appointments/:id/cancel')
  cancelAppointment(
    @CurrentUser() user: AuthJwtPayload,
    @Param('id') id: string,
  ) {
    return this.schedulingService.cancelAppointment(user.userId, id);
  }
}
