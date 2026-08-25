import { Module } from '@nestjs/common';
import { CalendarModule } from '../calendar/calendar.module';
import { EmailModule } from '../email/email.module';
import { PublicBookingController } from './public-booking.controller';
import { ReminderScheduler } from './reminder.scheduler';
import { SchedulingController } from './scheduling.controller';
import { SchedulingService } from './scheduling.service';

@Module({
  imports: [CalendarModule, EmailModule],
  controllers: [SchedulingController, PublicBookingController],
  providers: [SchedulingService, ReminderScheduler],
})
export class SchedulingModule {}
