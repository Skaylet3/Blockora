import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NoteController } from './note.controller';
import { NoteService } from './note.service';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

const mockNoteService = {
  create: vi.fn(),
  findAll: vi.fn(),
  findOne: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
};

const user: JwtPayload = { sub: 'user-1', email: 'test@example.com' };

const sampleNote = {
  id: 'note-1',
  title: 'Meeting Notes',
  content: 'Discussed Q1',
  userId: 'user-1',
  storageId: 'storage-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('NoteController', () => {
  let controller: NoteController;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NoteController],
      providers: [{ provide: NoteService, useValue: mockNoteService }],
    }).compile();

    controller = module.get<NoteController>(NoteController);
  });

  describe('create', () => {
    it('delegates to NoteService.create with user.sub', async () => {
      mockNoteService.create.mockResolvedValue(sampleNote);

      const dto = { title: 'Meeting Notes', storageId: 'storage-1' };
      const result = await controller.create(user, dto);

      expect(mockNoteService.create).toHaveBeenCalledWith('user-1', dto);
      expect(result).toEqual(sampleNote);
    });
  });

  describe('findAll', () => {
    it('delegates to NoteService.findAll without storageId filter', async () => {
      mockNoteService.findAll.mockResolvedValue([sampleNote]);

      const result = await controller.findAll(user, undefined);

      expect(mockNoteService.findAll).toHaveBeenCalledWith('user-1', undefined);
      expect(result).toHaveLength(1);
    });

    it('passes storageId query param to NoteService.findAll', async () => {
      mockNoteService.findAll.mockResolvedValue([sampleNote]);

      await controller.findAll(user, 'storage-1');

      expect(mockNoteService.findAll).toHaveBeenCalledWith(
        'user-1',
        'storage-1',
      );
    });
  });

  describe('findOne', () => {
    it('delegates to NoteService.findOne with user.sub and id', async () => {
      mockNoteService.findOne.mockResolvedValue(sampleNote);

      const result = await controller.findOne(user, 'note-1');

      expect(mockNoteService.findOne).toHaveBeenCalledWith('user-1', 'note-1');
      expect(result).toEqual(sampleNote);
    });
  });

  describe('update', () => {
    it('delegates to NoteService.update with user.sub, id, and dto', async () => {
      const updated = { ...sampleNote, title: 'Updated' };
      mockNoteService.update.mockResolvedValue(updated);

      const result = await controller.update(user, 'note-1', {
        title: 'Updated',
      });

      expect(mockNoteService.update).toHaveBeenCalledWith('user-1', 'note-1', {
        title: 'Updated',
      });
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('delegates to NoteService.remove with user.sub and id', async () => {
      mockNoteService.remove.mockResolvedValue(undefined);

      await controller.remove(user, 'note-1');

      expect(mockNoteService.remove).toHaveBeenCalledWith('user-1', 'note-1');
    });
  });
});
