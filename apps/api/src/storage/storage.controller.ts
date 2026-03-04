import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { CreateStorageDto } from './dto/create-storage.dto';
import { StorageResponseDto } from './dto/storage-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('storages')
@ApiBearerAuth('access-token')
@Controller('storages')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new storage (root or nested)' })
  @ApiResponse({
    status: 201,
    description: 'Storage created successfully',
    type: StorageResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 404,
    description: 'Parent storage not found or belongs to another user',
  })
  @ApiResponse({ status: 422, description: 'Validation error' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateStorageDto) {
    return this.storageService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List all storages for the authenticated user (flat with parentId)',
  })
  @ApiResponse({
    status: 200,
    description: 'Flat array of storages ordered by createdAt ascending',
    type: [StorageResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.storageService.findAll(user.sub);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete a storage and all its descendants and notes',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the storage',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 204,
    description: 'Storage deleted (cascade applied to children and notes)',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 404,
    description: 'Storage not found or belongs to another user',
  })
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.storageService.remove(user.sub, id);
  }
}
