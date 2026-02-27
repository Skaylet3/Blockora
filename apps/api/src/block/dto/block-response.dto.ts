import { ApiProperty } from '@nestjs/swagger';
import { BlockStatus, BlockType, BlockVisibility } from '@prisma/client';

export class BlockResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Block UUID',
  })
  id: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Owner user UUID',
  })
  userId: string;

  @ApiProperty({ example: 'My first note' })
  title: string;

  @ApiProperty({ example: 'Content goes here' })
  content: string;

  @ApiProperty({ enum: BlockType, enumName: 'BlockType', example: BlockType.NOTE })
  type: BlockType;

  @ApiProperty({
    enum: BlockStatus,
    enumName: 'BlockStatus',
    example: BlockStatus.ACTIVE,
  })
  status: BlockStatus;

  @ApiProperty({
    enum: BlockVisibility,
    enumName: 'BlockVisibility',
    example: BlockVisibility.PRIVATE,
  })
  visibility: BlockVisibility;

  @ApiProperty({
    type: [String],
    example: ['typescript', 'nestjs'],
    description: 'Array of string tags',
  })
  tags: string[];

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({
    example: null,
    nullable: true,
    description: 'Set when status transitions to ARCHIVED',
  })
  archivedAt: Date | null;
}
