import { PartialType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { TodoStatus } from '@prisma/client';
import { CreateTodoDto } from './create-todo.dto';

export class UpdateTodoDto extends PartialType(CreateTodoDto) {
  @ApiPropertyOptional({ enum: TodoStatus, enumName: 'TodoStatus', example: TodoStatus.COMPLETED })
  @IsOptional()
  @IsEnum(TodoStatus)
  status?: TodoStatus;
}
