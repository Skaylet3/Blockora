import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator'

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
    description:
      'Minimum 8 characters, must contain uppercase, lowercase, and a number',
    format: 'password',
  })
  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and number',
  })
  password: string;

  @ApiProperty({
    example: 'Alice',
    required: false,
    description: 'Optional display name',
  })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiProperty({
    description: 'Cloudflare Turnstile CAPTCHA token',
    example: '0.turnstile-token-string',
  })
  @IsString()
  @IsNotEmpty()
  captchaToken: string;
}
