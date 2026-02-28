import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Valid email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Str0ngP@ss!',
    minLength: 8,
    description: 'Minimum 8 characters',
    format: 'password',
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    example: 'Alice',
    required: false,
    description: 'Optional display name',
  })
  @IsString()
  @IsOptional()
  displayName?: string;
}
