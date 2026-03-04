import { IsOptional, IsString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNoteDto {
  @ApiPropertyOptional({
    example: 'Updated Title',
    description: 'New note title (min 1 char)',
  })
  @IsString()
  @MinLength(1)
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    example: 'Updated content',
    description: 'New note body content',
  })
  @IsString()
  @IsOptional()
  content?: string;
}
