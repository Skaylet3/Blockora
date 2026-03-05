import { ApiProperty } from '@nestjs/swagger';
import { TodoPriority, TodoStatus } from '@prisma/client';

export class TodoResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  userId: string;

  @ApiProperty({ example: 'Buy groceries' })
  title: string;

  @ApiProperty({ example: 'Milk, eggs, bread', nullable: true, type: String })
  description: string | null;

  @ApiProperty({ enum: TodoPriority, enumName: 'TodoPriority', example: TodoPriority.LOWEST })
  priority: TodoPriority;

  @ApiProperty({ enum: TodoStatus, enumName: 'TodoStatus', example: TodoStatus.ACTIVE })
  status: TodoStatus;

  @ApiProperty({ example: '2026-03-05T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-03-05T00:00:00.000Z' })
  updatedAt: Date;
}
