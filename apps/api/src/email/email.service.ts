import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  isConfigured() {
    return Boolean(this.config.get<string>('SMTP_HOST'));
  }

  async send(input: { to: string; subject: string; text: string }) {
    try {
      const transporter = await this.getTransporter();
      const from =
        this.config.get<string>('EMAIL_FROM') ??
        'TeacherConnect <no-reply@teacherconnect.local>';
      const info = await transporter.sendMail({
        from,
        to: input.to,
        subject: input.subject,
        text: input.text,
      });

      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) {
        this.logger.log(`Email preview for ${input.to}: ${preview}`);
      } else {
        this.logger.log(`Sent email to ${input.to}: ${input.subject}`);
      }
    } catch (error) {
      this.logger.error(`Email failed for ${input.to}`, error);
    }
  }

  private async getTransporter() {
    if (this.transporter) {
      return this.transporter;
    }

    if (process.env.CI && !this.config.get<string>('SMTP_HOST')) {
      this.logger.log('CI has no inbox. Skipping Ethereal and using a no-op mailer.');
      this.transporter = nodemailer.createTransport({ jsonTransport: true });
      return this.transporter;
    }

    const host = this.config.get<string>('SMTP_HOST');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(this.config.get<string>('SMTP_PORT') ?? 587),
        secure: this.config.get<string>('SMTP_SECURE') === 'true',
        auth: {
          user: this.config.get<string>('SMTP_USER'),
          pass: this.config.get<string>('SMTP_PASS'),
        },
      });
      return this.transporter;
    }

    const testAccount = await nodemailer.createTestAccount();
    this.logger.log(
      `No SMTP_HOST set. Using Ethereal test inbox: ${testAccount.user}`,
    );
    this.transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    return this.transporter;
  }
}
