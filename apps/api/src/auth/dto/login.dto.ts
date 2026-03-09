import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Str0ngP@ss!', format: 'password' })
  @IsString()
  password: string;

  @ApiProperty({
    description: 'Cloudflare Turnstile CAPTCHA token',
    example: '0.turnstile-token-string',
  })
  @IsString()
  @IsNotEmpty()
  captchaToken: string;
}
