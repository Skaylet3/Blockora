import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

const mockStorageService = {
  create: vi.fn(),
  findAll: vi.fn(),
  remove: vi.fn(),
};

const user: JwtPayload = { sub: 'user-1', email: 'test@example.com' };

const sampleStorage = {
  id: 'storage-1',
  name: 'Work',
  userId: 'user-1',
  parentId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('StorageController', () => {
  let controller: StorageController;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StorageController],
      providers: [{ provide: StorageService, useValue: mockStorageService }],
    }).compile();

    controller = module.get<StorageController>(StorageController);
  });

  describe('create', () => {
    it('delegates to StorageService.create with user.sub', async () => {
      mockStorageService.create.mockResolvedValue(sampleStorage);

      const result = await controller.create(user, { name: 'Work' });

      expect(mockStorageService.create).toHaveBeenCalledWith('user-1', {
        name: 'Work',
      });
      expect(result).toEqual(sampleStorage);
    });
  });

  describe('findAll', () => {
    it('delegates to StorageService.findAll with user.sub', async () => {
      mockStorageService.findAll.mockResolvedValue([sampleStorage]);

      const result = await controller.findAll(user);

      expect(mockStorageService.findAll).toHaveBeenCalledWith('user-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('remove', () => {
    it('delegates to StorageService.remove with user.sub and id', async () => {
      mockStorageService.remove.mockResolvedValue(undefined);

      await controller.remove(user, 'storage-1');

      expect(mockStorageService.remove).toHaveBeenCalledWith(
        'user-1',
        'storage-1',
      );
    });

    it('propagates NotFoundException when storage not found', async () => {
      const { NotFoundException } = await import('@nestjs/common');
      mockStorageService.remove.mockRejectedValue(
        new NotFoundException('Storage not found'),
      );

      await expect(controller.remove(user, 'bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
