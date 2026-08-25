import { Controller, Delete, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthJwtPayload } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CalendarService } from './calendar.service';

@ApiTags('calendar')
@Controller('calendar')
export class CalendarController {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly config: ConfigService,
  ) {}

  @Get('connect')
  @UseGuards(JwtAuthGuard)
  async connect(@CurrentUser() user: AuthJwtPayload) {
    const url = await this.calendarService.getConnectUrl(user.userId);
    return { url };
  }

  @Delete('connect')
  @UseGuards(JwtAuthGuard)
  async disconnect(@CurrentUser() user: AuthJwtPayload) {
    await this.calendarService.disconnect(user.userId);
    return { ok: true };
  }

  @Get('oauth/callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() response: Response,
  ) {
    const frontend = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';

    try {
      await this.calendarService.handleOAuthCallback(code, state);
      response.redirect(`${frontend}/schedule?calendar=connected`);
    } catch {
      response.redirect(`${frontend}/schedule?calendar=error`);
    }
  }
}
