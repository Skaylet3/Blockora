import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TodoStatus } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { CreateTodoDto } from './dto/create-todo.dto';
import { PromoteBlockDto } from './dto/promote-block.dto';
import { TodoFilterDto } from './dto/todo-filter.dto';
import { TodoResponseDto } from './dto/todo-response.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodoService } from './todo.service';

@ApiTags('todos')
@ApiBearerAuth('access-token')
@Controller('todos')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  // IMPORTANT: this route must be declared before GET /:id to avoid ambiguity
  @Post('from-block/:blockId')
  @ApiOperation({ summary: 'Promote a TASK-type block into a new todo' })
  @ApiParam({ name: 'blockId', description: 'UUID of the block to promote', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 201, description: 'Todo created from block', type: TodoResponseDto })
  @ApiResponse({ status: 400, description: 'Block is not of type TASK' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Block not found or does not belong to user' })
  @ApiResponse({ status: 422, description: 'Validation error' })
  promoteBlock(
    @Param('blockId') blockId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: PromoteBlockDto,
  ) {
    return this.todoService.promoteBlock(blockId, user.sub, dto.priority);
  }

  @Get()
  @ApiOperation({ summary: 'List all todos for the authenticated user' })
  @ApiQuery({ name: 'status', enum: TodoStatus, enumName: 'TodoStatus', required: false })
  @ApiResponse({ status: 200, description: 'Array of todos ordered by createdAt descending', type: [TodoResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@CurrentUser() user: JwtPayload, @Query() filter: TodoFilterDto) {
    return this.todoService.findAll(user.sub, filter.status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single todo by UUID' })
  @ApiParam({ name: 'id', description: 'UUID of the todo', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: 'Todo found', type: TodoResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Todo not found or does not belong to user' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.todoService.findOne(id, user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new todo' })
  @ApiResponse({ status: 201, description: 'Todo created successfully', type: TodoResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation error' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateTodoDto) {
    return this.todoService.create(user.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partially update a todo' })
  @ApiParam({ name: 'id', description: 'UUID of the todo', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: 'Todo updated successfully', type: TodoResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Todo not found or does not belong to user' })
  @ApiResponse({ status: 422, description: 'Validation error' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateTodoDto,
  ) {
    return this.todoService.update(id, user.sub, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Permanently delete a todo' })
  @ApiParam({ name: 'id', description: 'UUID of the todo', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: 'Todo deleted', type: TodoResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Todo not found or does not belong to user' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.todoService.remove(id, user.sub);
  }
}
