import { ApiProperty } from '@nestjs/swagger';

export class NoteResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Meeting Notes' })
  title: string;

  @ApiProperty({ example: 'Discussed Q1 goals' })
  content: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  storageId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
