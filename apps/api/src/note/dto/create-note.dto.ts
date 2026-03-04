import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNoteDto {
  @ApiProperty({
    example: 'Meeting Notes',
    description: 'Note title (min 1 char)',
  })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiPropertyOptional({
    example: 'Discussed Q1 goals',
    description: 'Note body content; defaults to empty string',
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'UUID of the storage this note belongs to',
  })
  @IsUUID()
  storageId: string;
}
