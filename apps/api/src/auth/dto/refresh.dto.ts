import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshDto {
  @ApiProperty({
    description: 'Refresh token obtained from /auth/login or /auth/refresh',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsString()
  refreshToken: string;

  @ApiProperty({
    description: 'Cloudflare Turnstile CAPTCHA token',
    example: '0.turnstile-token-string',
  })
  @IsString()
  @IsNotEmpty()
  captchaToken: string;
}
