import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { TodoStatus } from '@prisma/client';

export class TodoFilterDto {
  @ApiPropertyOptional({ enum: TodoStatus, enumName: 'TodoStatus', example: TodoStatus.ACTIVE })
  @IsOptional()
  @IsEnum(TodoStatus)
  status?: TodoStatus;
}
