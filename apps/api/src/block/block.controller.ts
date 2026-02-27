import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BlockService } from './block.service';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateBlockDto } from './dto/update-block.dto';
import { BlockResponseDto } from './dto/block-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('blocks')
@ApiBearerAuth('access-token')
@Controller('blocks')
export class BlockController {
  constructor(private readonly blockService: BlockService) {}

  @Get()
  @ApiOperation({
    summary: 'List all non-deleted blocks for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of blocks ordered by createdAt descending',
    type: [BlockResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.blockService.findAll(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single block by UUID' })
  @ApiParam({ name: 'id', description: 'UUID of the block', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: 'Block found', type: BlockResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 404,
    description: 'Block not found or belongs to another user',
  })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.blockService.findOne(id, user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new block' })
  @ApiResponse({ status: 201, description: 'Block created successfully', type: BlockResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 422, description: 'Validation error' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateBlockDto) {
    return this.blockService.create(user.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partially update a block' })
  @ApiParam({ name: 'id', description: 'UUID of the block', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({ status: 200, description: 'Block updated successfully', type: BlockResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 404,
    description: 'Block not found or belongs to another user',
  })
  @ApiResponse({ status: 422, description: 'Validation error' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateBlockDto,
  ) {
    return this.blockService.update(id, user.sub, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a block' })
  @ApiParam({ name: 'id', description: 'UUID of the block', example: '550e8400-e29b-41d4-a716-446655440000' })
  @ApiResponse({
    status: 200,
    description: 'Block soft-deleted (status: DELETED)',
    type: BlockResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 404,
    description: 'Block not found or belongs to another user',
  })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.blockService.remove(id, user.sub);
  }
}
