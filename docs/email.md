# Email confirmations

A booking is saved first. Email is extra. If email fails, the appointment still exists.

## Local development (no setup)

Leave `SMTP_HOST` empty. The API uses [Ethereal](https://ethereal.email/), a fake inbox.

1. Book a time and include a parent email.
2. Watch the API terminal for `Email preview: https://ethereal.email/message/...`
3. Open that link. You will see the confirmation without sending real mail.

## Send real email later (optional, usually free)

Add SMTP settings to `.env`:

```bash
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=your-resend-api-key
EMAIL_FROM=TeacherConnect <you@yourdomain.com>
```

[Resend](https://resend.com/) has a free tier. Gmail SMTP also works with an App Password, but school/work Gmail often blocks it.

Restart the API after changing `.env`.

## Reminders

The API checks every minute for confirmed appointments that start in the next hour. It emails the teacher and the parent (if they left an email), then sets `reminderSentAt` so it does not send twice.

