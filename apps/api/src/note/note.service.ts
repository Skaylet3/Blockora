import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Injectable()
export class NoteService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateNoteDto) {
    const storage = await this.prisma.db.storage.findFirst({
      where: { id: dto.storageId, userId },
    });
    if (!storage) throw new NotFoundException('Storage not found');

    return this.prisma.db.note.create({
      data: {
        title: dto.title,
        content: dto.content ?? '',
        storageId: dto.storageId,
        userId,
      },
    });
  }

  findAll(userId: string, storageId?: string) {
    return this.prisma.db.note.findMany({
      where: { userId, ...(storageId ? { storageId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const note = await this.prisma.db.note.findFirst({
      where: { id, userId },
    });
    if (!note) throw new NotFoundException('Note not found');
    return note;
  }

  async update(userId: string, id: string, dto: UpdateNoteDto) {
    await this.findOne(userId, id);
    return this.prisma.db.note.update({
      where: { id },
      data: dto,
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.db.note.delete({ where: { id } });
  }
}
