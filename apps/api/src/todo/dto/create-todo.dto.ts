import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { TodoPriority } from '@prisma/client';

export class CreateTodoDto {
  @ApiProperty({ example: 'Buy groceries', description: 'Todo title (min 1 char)' })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiPropertyOptional({ example: 'Milk, eggs, bread' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: TodoPriority, enumName: 'TodoPriority', example: TodoPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TodoPriority)
  priority?: TodoPriority;
}
