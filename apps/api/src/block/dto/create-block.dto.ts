import { IsArray, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BlockType, BlockVisibility } from '@prisma/client';

export class CreateBlockDto {
  @ApiProperty({ example: 'My first note', description: 'Block title (min 1 char)' })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({ example: 'Content goes here', description: 'Block body content' })
  @IsString()
  content: string;

  @ApiProperty({ enum: BlockType, enumName: 'BlockType', required: false, example: BlockType.NOTE })
  @IsEnum(BlockType)
  @IsOptional()
  type?: BlockType;

  @ApiProperty({
    enum: BlockVisibility,
    enumName: 'BlockVisibility',
    required: false,
    example: BlockVisibility.PRIVATE,
  })
  @IsEnum(BlockVisibility)
  @IsOptional()
  visibility?: BlockVisibility;

  @ApiProperty({
    type: [String],
    required: false,
    example: ['typescript', 'nestjs'],
    description: 'Array of string tags',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
