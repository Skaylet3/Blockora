import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { TodoPriority } from '@prisma/client';

export class PromoteBlockDto {
  @ApiPropertyOptional({ enum: TodoPriority, enumName: 'TodoPriority', example: TodoPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TodoPriority)
  priority?: TodoPriority;
}
