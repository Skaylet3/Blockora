import { ApiProperty } from '@nestjs/swagger';

export class TokenPairDto {
  @ApiProperty({
    description: 'Short-lived JWT access token (expires in 15 min)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Opaque refresh token — use POST /api/auth/refresh to rotate',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  refreshToken: string;
}
