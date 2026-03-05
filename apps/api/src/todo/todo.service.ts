import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BlockStatus, BlockType, TodoPriority, TodoStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Injectable()
export class TodoService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string, status?: TodoStatus) {
    return this.prisma.db.todo.findMany({
      where: { userId, ...(status && { status }) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const todo = await this.prisma.db.todo.findFirst({
      where: { id, userId },
    });
    if (!todo) throw new NotFoundException('Todo not found');
    return todo;
  }

  create(userId: string, dto: CreateTodoDto) {
    return this.prisma.db.todo.create({
      data: { userId, ...dto },
    });
  }

  async update(id: string, userId: string, dto: UpdateTodoDto) {
    await this.findOne(id, userId);
    return this.prisma.db.todo.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.db.todo.delete({
      where: { id },
    });
  }

  async promoteBlock(blockId: string, userId: string, priority?: TodoPriority) {
    const block = await this.prisma.db.block.findFirst({
      where: { id: blockId, userId, status: { not: BlockStatus.DELETED } },
    });
    if (!block) throw new NotFoundException('Block not found');
    if (block.type !== BlockType.TASK) {
      throw new BadRequestException('Block type must be TASK to promote');
    }
    return this.prisma.db.todo.create({
      data: {
        userId,
        title: block.title,
        description: block.content || undefined,
        priority: priority ?? TodoPriority.LOWEST,
      },
    });
  }
}
