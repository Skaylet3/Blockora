import { Injectable, NotFoundException } from '@nestjs/common';
import { BlockStatus, BlockType, BlockVisibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BlockService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.db.block.findMany({
      where: { userId, status: { not: BlockStatus.DELETED } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const block = await this.prisma.db.block.findFirst({
      where: { id, userId, status: { not: BlockStatus.DELETED } },
    });
    if (!block) throw new NotFoundException('Block not found');
    return block;
  }

  create(
    userId: string,
    body: {
      title: string;
      content: string;
      type?: BlockType;
      visibility?: BlockVisibility;
      tags?: string[];
    },
  ) {
    return this.prisma.db.block.create({
      data: { userId, ...body },
    });
  }

  async update(
    id: string,
    userId: string,
    body: {
      title?: string;
      content?: string;
      type?: BlockType;
      visibility?: BlockVisibility;
      tags?: string[];
    },
  ) {
    await this.findOne(id, userId);
    return this.prisma.db.block.update({
      where: { id },
      data: body,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.db.block.update({
      where: { id },
      data: { status: BlockStatus.DELETED },
    });
  }
}
