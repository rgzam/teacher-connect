import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'teacher@teacherconnect.dev' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'DemoPass123!' })
  @IsString()
  @MinLength(8)
  password!: string;
}
