import { Module } from '@nestjs/common';
import { CalendarModule } from '../calendar/calendar.module';
import { EmailModule } from '../email/email.module';
import { PublicBookingController } from './public-booking.controller';
import { PublicManageController } from './public-manage.controller';
import { ReminderScheduler } from './reminder.scheduler';
import { SchedulingController } from './scheduling.controller';
import { SchedulingService } from './scheduling.service';

@Module({
  imports: [CalendarModule, EmailModule],
  controllers: [
    SchedulingController,
    PublicBookingController,
    PublicManageController,
  ],
  providers: [SchedulingService, ReminderScheduler],
})
export class SchedulingModule {}
