import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BlockStatus, BlockType, TodoPriority, TodoStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TodoService } from './todo.service';

const mockTodo = {
  id: 'todo-uuid',
  userId: 'user-uuid',
  title: 'Test todo',
  description: null,
  priority: TodoPriority.MEDIUM,
  status: TodoStatus.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockBlock = {
  id: 'block-uuid',
  userId: 'user-uuid',
  title: 'Task block',
  content: 'Some content',
  type: BlockType.TASK,
  status: BlockStatus.ACTIVE,
  visibility: 'PRIVATE' as const,
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  archivedAt: null,
};

const mockPrisma = {
  db: {
    todo: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    block: {
      findFirst: vi.fn(),
    },
  },
};

describe('TodoService', () => {
  let service: TodoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodoService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TodoService>(TodoService);
    vi.clearAllMocks();
  });

  // ─── findAll ─────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns todos scoped to userId without status filter', async () => {
      mockPrisma.db.todo.findMany.mockResolvedValue([mockTodo]);
      const result = await service.findAll('user-uuid');
      expect(mockPrisma.db.todo.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-uuid' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockTodo]);
    });

    it('passes status filter to Prisma when provided', async () => {
      mockPrisma.db.todo.findMany.mockResolvedValue([mockTodo]);
      await service.findAll('user-uuid', TodoStatus.ACTIVE);
      expect(mockPrisma.db.todo.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-uuid', status: TodoStatus.ACTIVE },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('omits status key from where clause when status is undefined', async () => {
      mockPrisma.db.todo.findMany.mockResolvedValue([]);
      await service.findAll('user-uuid', undefined);
      const call = mockPrisma.db.todo.findMany.mock.calls[0][0];
      expect(call.where).not.toHaveProperty('status');
    });
  });

  // ─── findOne ─────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the todo when it exists and belongs to the user', async () => {
      mockPrisma.db.todo.findFirst.mockResolvedValue(mockTodo);
      const result = await service.findOne('todo-uuid', 'user-uuid');
      expect(result).toEqual(mockTodo);
    });

    it('throws NotFoundException when todo does not exist', async () => {
      mockPrisma.db.todo.findFirst.mockResolvedValue(null);
      await expect(service.findOne('missing-uuid', 'user-uuid')).rejects.toThrow(
        new NotFoundException('Todo not found'),
      );
    });

    it('throws NotFoundException when todo belongs to another user', async () => {
      mockPrisma.db.todo.findFirst.mockResolvedValue(null);
      await expect(service.findOne('todo-uuid', 'other-user-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a todo with the correct userId and dto fields', async () => {
      mockPrisma.db.todo.create.mockResolvedValue(mockTodo);
      const dto = { title: 'Test todo', priority: TodoPriority.HIGH };
      await service.create('user-uuid', dto);
      expect(mockPrisma.db.todo.create).toHaveBeenCalledWith({
        data: { userId: 'user-uuid', ...dto },
      });
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates the todo after ownership check', async () => {
      mockPrisma.db.todo.findFirst.mockResolvedValue(mockTodo);
      const updated = { ...mockTodo, title: 'Updated title' };
      mockPrisma.db.todo.update.mockResolvedValue(updated);
      const result = await service.update('todo-uuid', 'user-uuid', { title: 'Updated title' });
      expect(mockPrisma.db.todo.update).toHaveBeenCalledWith({
        where: { id: 'todo-uuid' },
        data: { title: 'Updated title' },
      });
      expect(result).toEqual(updated);
    });

    it('throws NotFoundException when todo not found during update', async () => {
      mockPrisma.db.todo.findFirst.mockResolvedValue(null);
      await expect(service.update('bad-uuid', 'user-uuid', {})).rejects.toThrow(NotFoundException);
    });
  });

  // ─── remove ──────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('hard-deletes the todo after ownership check', async () => {
      mockPrisma.db.todo.findFirst.mockResolvedValue(mockTodo);
      mockPrisma.db.todo.delete.mockResolvedValue(mockTodo);
      const result = await service.remove('todo-uuid', 'user-uuid');
      expect(mockPrisma.db.todo.delete).toHaveBeenCalledWith({ where: { id: 'todo-uuid' } });
      expect(result).toEqual(mockTodo);
    });

    it('throws NotFoundException when todo not found during remove', async () => {
      mockPrisma.db.todo.findFirst.mockResolvedValue(null);
      await expect(service.remove('bad-uuid', 'user-uuid')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── promoteBlock ─────────────────────────────────────────────────────────

  describe('promoteBlock', () => {
    it('creates a todo from the block title with MEDIUM default priority', async () => {
      mockPrisma.db.block.findFirst.mockResolvedValue(mockBlock);
      mockPrisma.db.todo.create.mockResolvedValue(mockTodo);
      await service.promoteBlock('block-uuid', 'user-uuid');
      expect(mockPrisma.db.block.findFirst).toHaveBeenCalledWith({
        where: { id: 'block-uuid', userId: 'user-uuid', status: { not: BlockStatus.DELETED } },
      });
      expect(mockPrisma.db.todo.create).toHaveBeenCalledWith({
        data: { userId: 'user-uuid', title: mockBlock.title, description: 'Some content', priority: TodoPriority.LOWEST },
      });
    });

    it('uses the provided priority override', async () => {
      mockPrisma.db.block.findFirst.mockResolvedValue(mockBlock);
      mockPrisma.db.todo.create.mockResolvedValue({ ...mockTodo, priority: TodoPriority.HIGHEST });
      await service.promoteBlock('block-uuid', 'user-uuid', TodoPriority.HIGHEST);
      expect(mockPrisma.db.todo.create).toHaveBeenCalledWith({
        data: { userId: 'user-uuid', title: mockBlock.title, description: 'Some content', priority: TodoPriority.HIGHEST },
      });
    });

    it('sets description to undefined when block content is empty', async () => {
      const emptyContentBlock = { ...mockBlock, content: '' };
      mockPrisma.db.block.findFirst.mockResolvedValue(emptyContentBlock);
      mockPrisma.db.todo.create.mockResolvedValue(mockTodo);
      await service.promoteBlock('block-uuid', 'user-uuid');
      expect(mockPrisma.db.todo.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-uuid',
          title: mockBlock.title,
          description: undefined,
          priority: TodoPriority.LOWEST,
        },
      });
    });

    it('throws NotFoundException when block is not found', async () => {
      mockPrisma.db.block.findFirst.mockResolvedValue(null);
      await expect(service.promoteBlock('bad-uuid', 'user-uuid')).rejects.toThrow(
        new NotFoundException('Block not found'),
      );
    });

    it('throws BadRequestException when block type is not TASK', async () => {
      mockPrisma.db.block.findFirst.mockResolvedValue({ ...mockBlock, type: BlockType.NOTE });
      await expect(service.promoteBlock('block-uuid', 'user-uuid')).rejects.toThrow(
        new BadRequestException('Block type must be TASK to promote'),
      );
    });
  });
});
