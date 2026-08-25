import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { google } from 'googleapis';
import { PrismaService } from '../prisma/prisma.service';
import { TeacherAccessService } from '../teacher/teacher-access.service';
import { mapFreeBusyPeriods } from './map-freebusy';

const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.freebusy',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
];

@Injectable()
export class CalendarService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly teacherAccess: TeacherAccessService,
  ) {}

  isConfigured() {
    return Boolean(
      this.config.get<string>('GOOGLE_CLIENT_ID') &&
        this.config.get<string>('GOOGLE_CLIENT_SECRET'),
    );
  }

  async getConnectUrl(userId: string) {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'Google Calendar is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
      );
    }

    await this.teacherAccess.requireTeacher(userId);
    const client = this.createOAuthClient();
    const state = await this.jwt.signAsync(
      { sub: userId, purpose: 'google-calendar' },
      { expiresIn: '10m' },
    );

    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: CALENDAR_SCOPES,
      state,
    });
  }

  async handleOAuthCallback(code: string, state: string) {
    const payload = await this.jwt
      .verifyAsync<{ sub: string; purpose: string }>(state)
      .catch(() => {
        throw new UnauthorizedException('Invalid calendar connect state');
      });

    if (payload.purpose !== 'google-calendar') {
      throw new UnauthorizedException('Invalid calendar connect state');
    }

    const teacher = await this.teacherAccess.requireTeacher(payload.sub);
    const client = this.createOAuthClient();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: client });
    const profile = await oauth2.userinfo.get();
    const existing = await this.prisma.calendarConnection.findUnique({
      where: { teacherId: teacher.id },
    });

    const refreshToken = tokens.refresh_token ?? existing?.refreshToken;
    if (!refreshToken || !tokens.access_token) {
      throw new ServiceUnavailableException(
        'Google did not return usable tokens. Try connecting again.',
      );
    }

    await this.prisma.calendarConnection.upsert({
      where: { teacherId: teacher.id },
      create: {
        teacherId: teacher.id,
        googleAccountEmail: profile.data.email ?? 'unknown',
        accessToken: tokens.access_token,
        refreshToken,
        tokenExpiresAt: new Date(tokens.expiry_date ?? Date.now() + 45 * 60 * 1000),
        calendarId: 'primary',
      },
      update: {
        googleAccountEmail: profile.data.email ?? existing?.googleAccountEmail ?? 'unknown',
        accessToken: tokens.access_token,
        refreshToken,
        tokenExpiresAt: new Date(tokens.expiry_date ?? Date.now() + 45 * 60 * 1000),
      },
    });
  }

  async disconnect(userId: string) {
    const teacher = await this.teacherAccess.requireTeacher(userId);
    await this.prisma.calendarConnection.deleteMany({
      where: { teacherId: teacher.id },
    });
  }

  async getStatus(teacherId: string) {
    const connection = await this.prisma.calendarConnection.findUnique({
      where: { teacherId },
    });

    return {
      configured: this.isConfigured(),
      connected: Boolean(connection),
      email: connection?.googleAccountEmail ?? null,
    };
  }

  async getBusyRanges(teacherId: string, timeMin: Date, timeMax: Date) {
    const auth = await this.getAuthorizedClient(teacherId);
    if (!auth) {
      return [];
    }

    try {
      const calendar = google.calendar({ version: 'v3', auth: auth.client });
      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          items: [{ id: auth.connection.calendarId }],
        },
      });
      const periods =
        response.data.calendars?.[auth.connection.calendarId]?.busy ?? [];
      return mapFreeBusyPeriods(periods);
    } catch (error) {
      console.error('Google freeBusy failed', error);
      return [];
    }
  }

  async createBookingEvent(input: {
    teacherId: string;
    summary: string;
    startsAt: Date;
    endsAt: Date;
    timeZone: string;
  }) {
    const auth = await this.getAuthorizedClient(input.teacherId);
    if (!auth) {
      return null;
    }

    try {
      const calendar = google.calendar({ version: 'v3', auth: auth.client });
      const response = await calendar.events.insert({
        calendarId: auth.connection.calendarId,
        requestBody: {
          summary: input.summary,
          description:
            'Booked in TeacherConnect. Student details stay in TeacherConnect, not on this event.',
          start: {
            dateTime: input.startsAt.toISOString(),
            timeZone: input.timeZone,
          },
          end: {
            dateTime: input.endsAt.toISOString(),
            timeZone: input.timeZone,
          },
        },
      });
      return response.data.id ?? null;
    } catch (error) {
      console.error('Google event create failed', error);
      return null;
    }
  }

  async deleteBookingEvent(teacherId: string, googleEventId: string | null) {
    if (!googleEventId) {
      return;
    }

    const auth = await this.getAuthorizedClient(teacherId);
    if (!auth) {
      return;
    }

    try {
      const calendar = google.calendar({ version: 'v3', auth: auth.client });
      await calendar.events.delete({
        calendarId: auth.connection.calendarId,
        eventId: googleEventId,
      });
    } catch (error) {
      console.error('Google event delete failed', error);
    }
  }

  private createOAuthClient() {
    return new google.auth.OAuth2(
      this.config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      this.config.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      this.config.get<string>('GOOGLE_REDIRECT_URI') ??
        'http://localhost:3001/api/calendar/oauth/callback',
    );
  }

  private async getAuthorizedClient(teacherId: string) {
    const connection = await this.prisma.calendarConnection.findUnique({
      where: { teacherId },
    });

    if (!connection || !this.isConfigured()) {
      return null;
    }

    const client = this.createOAuthClient();
    client.setCredentials({
      access_token: connection.accessToken,
      refresh_token: connection.refreshToken,
      expiry_date: connection.tokenExpiresAt.getTime(),
    });

    if (connection.tokenExpiresAt.getTime() <= Date.now() + 60_000) {
      const { credentials } = await client.refreshAccessToken();
      if (credentials.access_token) {
        await this.prisma.calendarConnection.update({
          where: { teacherId },
          data: {
            accessToken: credentials.access_token,
            refreshToken: credentials.refresh_token ?? connection.refreshToken,
            tokenExpiresAt: new Date(
              credentials.expiry_date ?? Date.now() + 45 * 60 * 1000,
            ),
          },
        });
      }
    }

    return { client, connection };
  }
}
