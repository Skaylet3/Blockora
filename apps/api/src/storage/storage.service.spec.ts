import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StorageService } from './storage.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  db: {
    storage: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
  },
};

const sampleStorage = {
  id: 'storage-1',
  name: 'Work',
  userId: 'user-1',
  parentId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  describe('create', () => {
    it('creates a root-level storage when no parentId provided', async () => {
      mockPrisma.db.storage.create.mockResolvedValue(sampleStorage);

      const result = await service.create('user-1', { name: 'Work' });

      expect(mockPrisma.db.storage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-1', name: 'Work' }),
        }),
      );
      expect(result).toEqual(sampleStorage);
    });

    it('creates a child storage and verifies parent ownership', async () => {
      const parent = { ...sampleStorage, id: 'parent-1' };
      const child = { ...sampleStorage, id: 'child-1', parentId: 'parent-1' };

      mockPrisma.db.storage.findFirst.mockResolvedValue(parent);
      mockPrisma.db.storage.create.mockResolvedValue(child);

      const result = await service.create('user-1', {
        name: 'Projects',
        parentId: 'parent-1',
      });

      expect(mockPrisma.db.storage.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'parent-1', userId: 'user-1' },
        }),
      );
      expect(result.parentId).toBe('parent-1');
    });

    it('throws NotFoundException when parentId does not belong to the user', async () => {
      mockPrisma.db.storage.findFirst.mockResolvedValue(null);

      await expect(
        service.create('user-1', { name: 'Child', parentId: 'foreign-id' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('returns all storages for the user ordered by createdAt asc', async () => {
      mockPrisma.db.storage.findMany.mockResolvedValue([sampleStorage]);

      const result = await service.findAll('user-1');

      expect(mockPrisma.db.storage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          orderBy: { createdAt: 'asc' },
        }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('remove', () => {
    it('deletes storage when user owns it', async () => {
      mockPrisma.db.storage.findFirst.mockResolvedValue(sampleStorage);
      mockPrisma.db.storage.delete.mockResolvedValue(sampleStorage);

      await service.remove('user-1', 'storage-1');

      expect(mockPrisma.db.storage.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'storage-1' } }),
      );
    });

    it('throws NotFoundException when storage does not belong to user', async () => {
      mockPrisma.db.storage.findFirst.mockResolvedValue(null);

      await expect(service.remove('user-1', 'foreign-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
