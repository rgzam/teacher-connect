import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ContactMethod, ContactOutcome } from '@prisma/client';

export class RecordContactDto {
  @IsEnum(ContactMethod)
  method!: ContactMethod;

  @IsEnum(ContactOutcome)
  outcome!: ContactOutcome;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  @IsOptional()
  @IsBoolean()
  complete?: boolean;
}
