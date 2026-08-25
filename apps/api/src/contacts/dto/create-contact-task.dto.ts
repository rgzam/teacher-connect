import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ContactPriority, ContactReason } from '@prisma/client';

export class CreateContactTaskDto {
  @IsUUID()
  studentId!: string;

  @IsOptional()
  @IsUUID()
  guardianId?: string;

  @IsEnum(ContactReason)
  reason!: ContactReason;

  @IsEnum(ContactPriority)
  priority!: ContactPriority;

  @IsDateString()
  dueDate!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
