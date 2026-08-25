import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthJwtPayload } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ContactsService } from './contacts.service';
import { CreateContactTaskDto } from './dto/create-contact-task.dto';
import { RecordContactDto } from './dto/record-contact.dto';

@ApiTags('contacts')
@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthJwtPayload,
    @Query('includeCompleted') includeCompleted?: string,
  ) {
    return this.contactsService.list(user.userId, includeCompleted === 'true');
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthJwtPayload, @Param('id') id: string) {
    return this.contactsService.getOne(user.userId, id);
  }

  @Post()
  create(@CurrentUser() user: AuthJwtPayload, @Body() dto: CreateContactTaskDto) {
    return this.contactsService.create(user.userId, dto);
  }

  @Post(':id/logs')
  recordAttempt(
    @CurrentUser() user: AuthJwtPayload,
    @Param('id') id: string,
    @Body() dto: RecordContactDto,
  ) {
    return this.contactsService.recordAttempt(user.userId, id, dto);
  }
}
