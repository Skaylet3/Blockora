import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BlockType, BlockVisibility } from '@prisma/client';

export class CreateBlockDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  content: string;

  @ApiProperty({ enum: BlockType, enumName: 'BlockType', required: false })
  @IsEnum(BlockType)
  @IsOptional()
  type?: BlockType;

  @ApiProperty({
    enum: BlockVisibility,
    enumName: 'BlockVisibility',
    required: false,
  })
  @IsEnum(BlockVisibility)
  @IsOptional()
  visibility?: BlockVisibility;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
