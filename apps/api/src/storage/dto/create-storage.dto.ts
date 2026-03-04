import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStorageDto {
  @ApiProperty({
    example: 'Work',
    description: 'Storage name (min 1 char)',
  })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Parent storage UUID; omit for root-level storage',
  })
  @IsUUID()
  @IsOptional()
  parentId?: string;
}
