import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStorageDto } from './dto/create-storage.dto';

@Injectable()
export class StorageService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateStorageDto) {
    if (dto.parentId) {
      const parent = await this.prisma.db.storage.findFirst({
        where: { id: dto.parentId, userId },
      });
      if (!parent) throw new NotFoundException('Parent storage not found');
    }

    return this.prisma.db.storage.create({
      data: {
        name: dto.name,
        userId,
        parentId: dto.parentId ?? null,
      },
    });
  }

  findAll(userId: string) {
    return this.prisma.db.storage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async remove(userId: string, id: string) {
    const storage = await this.prisma.db.storage.findFirst({
      where: { id, userId },
    });
    if (!storage) throw new NotFoundException('Storage not found');

    return this.prisma.db.storage.delete({ where: { id } });
  }
}
