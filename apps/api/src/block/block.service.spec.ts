import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BlockService } from './block.service';
import { PrismaService } from '../prisma/prisma.service';
import { BlockStatus } from '@prisma/client';

const mockPrisma = {
  db: {
    block: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
};

const sampleBlock = {
  id: 'block-1',
  userId: 'user-1',
  title: 'Test Block',
  content: 'Content',
  type: 'NOTE',
  status: BlockStatus.ACTIVE,
  visibility: 'PRIVATE',
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  archivedAt: null,
};

describe('BlockService', () => {
  let service: BlockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BlockService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BlockService>(BlockService);
  });

  describe('findAll', () => {
    it('calls findMany with userId filter and excludes deleted blocks', async () => {
      mockPrisma.db.block.findMany.mockResolvedValue([sampleBlock]);

      const result = await service.findAll('user-1');

      expect(mockPrisma.db.block.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user-1',
            status: { not: BlockStatus.DELETED },
          },
        }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('returns the block when found', async () => {
      mockPrisma.db.block.findFirst.mockResolvedValue(sampleBlock);

      const result = await service.findOne('block-1', 'user-1');

      expect(result).toEqual(sampleBlock);
    });

    it('throws NotFoundException when block is not found', async () => {
      mockPrisma.db.block.findFirst.mockResolvedValue(null);

      await expect(service.findOne('missing', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates a block with the given userId and body', async () => {
      mockPrisma.db.block.create.mockResolvedValue(sampleBlock);

      const result = await service.create('user-1', {
        title: 'Test Block',
        content: 'Content',
      });

      expect(mockPrisma.db.block.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            title: 'Test Block',
          }),
        }),
      );
      expect(result).toEqual(sampleBlock);
    });
  });

  describe('update', () => {
    it('finds the block then updates it', async () => {
      mockPrisma.db.block.findFirst.mockResolvedValue(sampleBlock);
      const updated = { ...sampleBlock, title: 'Updated' };
      mockPrisma.db.block.update.mockResolvedValue(updated);

      const result = await service.update('block-1', 'user-1', {
        title: 'Updated',
      });

      expect(mockPrisma.db.block.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'block-1' },
          data: { title: 'Updated' },
        }),
      );
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('soft-deletes the block by setting status to DELETED', async () => {
      mockPrisma.db.block.findFirst.mockResolvedValue(sampleBlock);
      const deleted = { ...sampleBlock, status: BlockStatus.DELETED };
      mockPrisma.db.block.update.mockResolvedValue(deleted);

      const result = await service.remove('block-1', 'user-1');

      expect(mockPrisma.db.block.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'block-1' },
          data: { status: BlockStatus.DELETED },
        }),
      );
      expect(result.status).toBe(BlockStatus.DELETED);
    });
  });
});
