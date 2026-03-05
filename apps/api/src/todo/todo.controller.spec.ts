import { Test, TestingModule } from '@nestjs/testing';
import { TodoPriority, TodoStatus } from '@prisma/client';
import { TodoController } from './todo.controller';
import { TodoService } from './todo.service';

const mockUser = { sub: 'user-uuid', email: 'test@example.com' };

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

const mockTodoService = {
  findAll: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  promoteBlock: vi.fn(),
};

describe('TodoController', () => {
  let controller: TodoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TodoController],
      providers: [{ provide: TodoService, useValue: mockTodoService }],
    }).compile();

    controller = module.get<TodoController>(TodoController);
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('delegates to todoService.findAll with userId and status filter', async () => {
      mockTodoService.findAll.mockResolvedValue([mockTodo]);
      const result = await controller.findAll(mockUser as any, { status: TodoStatus.ACTIVE });
      expect(mockTodoService.findAll).toHaveBeenCalledWith('user-uuid', TodoStatus.ACTIVE);
      expect(result).toEqual([mockTodo]);
    });

    it('passes undefined status when no filter provided', async () => {
      mockTodoService.findAll.mockResolvedValue([]);
      await controller.findAll(mockUser as any, {});
      expect(mockTodoService.findAll).toHaveBeenCalledWith('user-uuid', undefined);
    });
  });

  describe('findOne', () => {
    it('delegates to todoService.findOne with id and userId', async () => {
      mockTodoService.findOne.mockResolvedValue(mockTodo);
      const result = await controller.findOne('todo-uuid', mockUser as any);
      expect(mockTodoService.findOne).toHaveBeenCalledWith('todo-uuid', 'user-uuid');
      expect(result).toEqual(mockTodo);
    });
  });

  describe('create', () => {
    it('delegates to todoService.create with userId and dto', async () => {
      mockTodoService.create.mockResolvedValue(mockTodo);
      const dto = { title: 'Test todo' };
      const result = await controller.create(mockUser as any, dto as any);
      expect(mockTodoService.create).toHaveBeenCalledWith('user-uuid', dto);
      expect(result).toEqual(mockTodo);
    });
  });

  describe('update', () => {
    it('delegates to todoService.update with id, userId, and dto', async () => {
      const updated = { ...mockTodo, title: 'Updated' };
      mockTodoService.update.mockResolvedValue(updated);
      const dto = { title: 'Updated' };
      const result = await controller.update('todo-uuid', mockUser as any, dto as any);
      expect(mockTodoService.update).toHaveBeenCalledWith('todo-uuid', 'user-uuid', dto);
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('delegates to todoService.remove with id and userId', async () => {
      mockTodoService.remove.mockResolvedValue(mockTodo);
      const result = await controller.remove('todo-uuid', mockUser as any);
      expect(mockTodoService.remove).toHaveBeenCalledWith('todo-uuid', 'user-uuid');
      expect(result).toEqual(mockTodo);
    });
  });

  describe('promoteBlock', () => {
    it('delegates to todoService.promoteBlock with blockId, userId, and priority', async () => {
      mockTodoService.promoteBlock.mockResolvedValue(mockTodo);
      const dto = { priority: TodoPriority.HIGH };
      const result = await controller.promoteBlock('block-uuid', mockUser as any, dto as any);
      expect(mockTodoService.promoteBlock).toHaveBeenCalledWith('block-uuid', 'user-uuid', TodoPriority.HIGH);
      expect(result).toEqual(mockTodo);
    });

    it('passes undefined priority when dto has no priority', async () => {
      mockTodoService.promoteBlock.mockResolvedValue(mockTodo);
      await controller.promoteBlock('block-uuid', mockUser as any, {} as any);
      expect(mockTodoService.promoteBlock).toHaveBeenCalledWith('block-uuid', 'user-uuid', undefined);
    });
  });
});
