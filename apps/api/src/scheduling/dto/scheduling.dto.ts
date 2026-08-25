import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class UpdateScheduleSettingsDto {
  @IsInt()
  @Min(0)
  @Max(60)
  bufferMinutes!: number;

  @IsInt()
  @Min(0)
  @Max(168)
  minNoticeHours!: number;

  @IsInt()
  @Min(1)
  @Max(90)
  maxBookingDays!: number;
}

export class AvailabilityWindowDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsString()
  startTime!: string;

  @IsString()
  endTime!: string;
}

export class ReplaceAvailabilityDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityWindowDto)
  windows!: AvailabilityWindowDto[];
}

export class CreateAppointmentTypeDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsInt()
  @Min(5)
  @Max(180)
  durationMinutes!: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(['VIRTUAL', 'HOME_VISIT'])
  format!: 'VIRTUAL' | 'HOME_VISIT';
}

export class CreateBlockedDateDto {
  @IsDateString()
  date!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class PublicBookDto {
  @IsUUID()
  appointmentTypeId!: string;

  @IsDateString()
  startsAt!: string;

  @IsString()
  @MinLength(1)
  guardianFirstName!: string;

  @IsString()
  @MinLength(1)
  guardianLastName!: string;

  @IsOptional()
  @IsEmail()
  guardianEmail?: string;

  @IsOptional()
  @IsString()
  guardianPhone?: string;

  @IsString()
  @MinLength(1)
  studentFirstName!: string;

  @IsString()
  @MinLength(1)
  studentLastName!: string;

  @IsOptional()
  @IsString()
  virtualMeetingName?: string;

  @IsOptional()
  @IsString()
  homeVisitAddress?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
