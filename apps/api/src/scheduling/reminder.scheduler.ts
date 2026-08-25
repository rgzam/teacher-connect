import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SchedulingService } from './scheduling.service';

@Injectable()
export class ReminderScheduler {
  private readonly logger = new Logger(ReminderScheduler.name);

  constructor(private readonly schedulingService: SchedulingService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async sendDueReminders() {
    const sent = await this.schedulingService.sendDueReminders();
    if (sent > 0) {
      this.logger.log(`Sent reminders for ${sent} appointment(s)`);
    }
  }
}
