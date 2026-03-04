import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { NoteService } from './note.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NoteResponseDto } from './dto/note-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('notes')
@ApiBearerAuth('access-token')
@Controller('notes')
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new note within a storage' })
  @ApiResponse({
    status: 201,
    description: 'Note created successfully',
    type: NoteResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 404,
    description: 'Storage not found or belongs to another user',
  })
  @ApiResponse({ status: 422, description: 'Validation error' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateNoteDto) {
    return this.noteService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({
    summary:
      'List notes for the authenticated user, optionally filtered by storageId',
  })
  @ApiQuery({
    name: 'storageId',
    required: false,
    description: 'Filter notes by storage UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of notes ordered by createdAt descending',
    type: [NoteResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('storageId') storageId?: string,
  ) {
    return this.noteService.findAll(user.sub, storageId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single note by UUID' })
  @ApiParam({
    name: 'id',
    description: 'UUID of the note',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Note found',
    type: NoteResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 404,
    description: 'Note not found or belongs to another user',
  })
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.noteService.findOne(user.sub, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update note title and/or content' })
  @ApiParam({
    name: 'id',
    description: 'UUID of the note',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Note updated successfully',
    type: NoteResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 404,
    description: 'Note not found or belongs to another user',
  })
  @ApiResponse({ status: 422, description: 'Validation error' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.noteService.update(user.sub, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a note' })
  @ApiParam({
    name: 'id',
    description: 'UUID of the note',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({ status: 204, description: 'Note deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 404,
    description: 'Note not found or belongs to another user',
  })
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.noteService.remove(user.sub, id);
  }
}
