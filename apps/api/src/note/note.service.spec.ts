import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NoteService } from './note.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  db: {
    note: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    storage: {
      findFirst: vi.fn(),
    },
  },
};

const sampleStorage = { id: 'storage-1', userId: 'user-1', name: 'Work' };

const sampleNote = {
  id: 'note-1',
  title: 'Meeting Notes',
  content: 'Discussed Q1',
  userId: 'user-1',
  storageId: 'storage-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('NoteService', () => {
  let service: NoteService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NoteService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<NoteService>(NoteService);
  });

  describe('create', () => {
    it('creates a note when storage belongs to user', async () => {
      mockPrisma.db.storage.findFirst.mockResolvedValue(sampleStorage);
      mockPrisma.db.note.create.mockResolvedValue(sampleNote);

      const result = await service.create('user-1', {
        title: 'Meeting Notes',
        storageId: 'storage-1',
      });

      expect(mockPrisma.db.storage.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'storage-1', userId: 'user-1' },
        }),
      );
      expect(mockPrisma.db.note.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            storageId: 'storage-1',
            title: 'Meeting Notes',
            content: '',
          }),
        }),
      );
      expect(result).toEqual(sampleNote);
    });

    it('throws NotFoundException when storage does not belong to user', async () => {
      mockPrisma.db.storage.findFirst.mockResolvedValue(null);

      await expect(
        service.create('user-1', {
          title: 'Note',
          storageId: 'foreign-storage',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('returns all notes for user when no storageId filter', async () => {
      mockPrisma.db.note.findMany.mockResolvedValue([sampleNote]);

      const result = await service.findAll('user-1');

      expect(mockPrisma.db.note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } }),
      );
      expect(result).toHaveLength(1);
    });

    it('filters by storageId when provided', async () => {
      mockPrisma.db.note.findMany.mockResolvedValue([sampleNote]);

      await service.findAll('user-1', 'storage-1');

      expect(mockPrisma.db.note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', storageId: 'storage-1' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns note when found', async () => {
      mockPrisma.db.note.findFirst.mockResolvedValue(sampleNote);

      const result = await service.findOne('user-1', 'note-1');

      expect(result).toEqual(sampleNote);
    });

    it('throws NotFoundException when note not found or foreign', async () => {
      mockPrisma.db.note.findFirst.mockResolvedValue(null);

      await expect(service.findOne('user-1', 'foreign-note')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('finds the note then updates it', async () => {
      mockPrisma.db.note.findFirst.mockResolvedValue(sampleNote);
      const updated = { ...sampleNote, title: 'Updated' };
      mockPrisma.db.note.update.mockResolvedValue(updated);

      const result = await service.update('user-1', 'note-1', {
        title: 'Updated',
      });

      expect(mockPrisma.db.note.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'note-1' },
          data: { title: 'Updated' },
        }),
      );
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('deletes the note when user owns it', async () => {
      mockPrisma.db.note.findFirst.mockResolvedValue(sampleNote);
      mockPrisma.db.note.delete.mockResolvedValue(sampleNote);

      await service.remove('user-1', 'note-1');

      expect(mockPrisma.db.note.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'note-1' } }),
      );
    });

    it('throws NotFoundException when note not found', async () => {
      mockPrisma.db.note.findFirst.mockResolvedValue(null);

      await expect(service.remove('user-1', 'foreign-note')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
