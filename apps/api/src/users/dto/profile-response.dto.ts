import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProfileResponseDto {
  @ApiProperty({
    description: 'Authenticated user UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  userId: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiPropertyOptional({
    description: 'User display name, null if not set',
    example: 'Alice',
    nullable: true,
  })
  displayName: string | null;
}
