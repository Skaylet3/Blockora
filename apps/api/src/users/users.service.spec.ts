import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

const mockPrisma = {
  db: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    vi.clearAllMocks();
  });

  describe('getProfile', () => {
    it('returns profile dto for existing user with displayName', async () => {
      mockPrisma.db.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        displayName: 'Alice',
      });

      const result = await service.getProfile('u1');

      expect(result).toEqual({ userId: 'u1', email: 'a@b.com', displayName: 'Alice' });
    });

    it('returns null displayName when not set on user', async () => {
      mockPrisma.db.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        displayName: null,
      });

      const result = await service.getProfile('u1');

      expect(result.displayName).toBeNull();
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockPrisma.db.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('updates displayName when provided', async () => {
      mockPrisma.db.user.update.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        displayName: 'Bob',
      });

      const result = await service.updateProfile('u1', { displayName: 'Bob' });

      expect(mockPrisma.db.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { displayName: 'Bob' },
      });
      expect(result.displayName).toBe('Bob');
    });

    it('sets displayName to null when key is present but value is undefined', async () => {
      mockPrisma.db.user.update.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        displayName: null,
      });

      const dto = {} as { displayName?: string };
      Object.assign(dto, { displayName: undefined }); // key present, value undefined

      await service.updateProfile('u1', dto);

      expect(mockPrisma.db.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { displayName: null },
      });
    });

    it('sends empty data when displayName key is absent from dto', async () => {
      mockPrisma.db.user.update.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        displayName: 'Existing',
      });

      await service.updateProfile('u1', {});

      expect(mockPrisma.db.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: {},
      });
    });
  });
});
