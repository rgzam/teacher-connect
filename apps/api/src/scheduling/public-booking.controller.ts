import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { PublicBookDto } from './dto/scheduling.dto';
import { SchedulingService } from './scheduling.service';

@ApiTags('public-booking')
@Controller('public/teachers')
export class PublicBookingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Get(':slug')
  getTeacher(@Param('slug') slug: string) {
    return this.schedulingService.getPublicTeacher(slug);
  }

  @Get(':slug/slots')
  getSlots(
    @Param('slug') slug: string,
    @Query('typeId') typeId: string,
  ) {
    return this.schedulingService.getPublicSlots(slug, typeId);
  }

  @Post(':slug/book')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  book(@Param('slug') slug: string, @Body() dto: PublicBookDto) {
    return this.schedulingService.bookPublic(slug, dto);
  }
}
