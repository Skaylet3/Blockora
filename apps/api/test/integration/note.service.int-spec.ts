import { NotFoundException } from '@nestjs/common';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  bootstrapIntegrationServices,
  cleanDatabase,
  closeIntegrationServices,
  IntegrationServicesContext,
  uniqueEmail,
} from './helpers/integration-services';
import { StorageService } from '../../src/storage/storage.service';
import { NoteService } from '../../src/note/note.service';

describe('NoteService (integration)', () => {
  let ctx: IntegrationServicesContext;
  let storageService: StorageService;
  let noteService: NoteService;

  beforeAll(async () => {
    ctx = await bootstrapIntegrationServices();
    storageService = new StorageService(ctx.prisma);
    noteService = new NoteService(ctx.prisma);
  });

  beforeEach(async () => {
    await cleanDatabase(ctx.prisma);
  });

  afterAll(async () => {
    await closeIntegrationServices(ctx);
  });

  async function createUserWithStorage() {
    const user = await ctx.prisma.db.user.create({
      data: { email: uniqueEmail('note-int'), passwordHash: 'hash' },
    });
    const storage = await storageService.create(user.id, { name: 'Default' });
    return { userId: user.id, storageId: storage.id };
  }

  it('create + findAll (by storageId) returns note in correct storage', async () => {
    const { userId, storageId } = await createUserWithStorage();

    await noteService.create(userId, {
      title: 'My Note',
      content: 'Content here',
      storageId,
    });

    const notes = await noteService.findAll(userId, storageId);
    expect(notes).toHaveLength(1);
    expect(notes[0].title).toBe('My Note');
    expect(notes[0].storageId).toBe(storageId);
  });

  it('findAll without storageId returns all user notes', async () => {
    const { userId, storageId } = await createUserWithStorage();
    const storage2 = await storageService.create(userId, { name: 'Second' });

    await noteService.create(userId, { title: 'Note 1', storageId });
    await noteService.create(userId, {
      title: 'Note 2',
      storageId: storage2.id,
    });

    const all = await noteService.findAll(userId);
    expect(all).toHaveLength(2);
  });

  it('findAll scoped to user — other user notes not returned', async () => {
    const { userId: userId1, storageId: storageId1 } =
      await createUserWithStorage();
    const { userId: userId2 } = await createUserWithStorage();

    await noteService.create(userId1, { title: 'User1 Note', storageId: storageId1 });

    const user2Notes = await noteService.findAll(userId2);
    expect(user2Notes).toHaveLength(0);
  });

  it('findOne returns correct note', async () => {
    const { userId, storageId } = await createUserWithStorage();

    const note = await noteService.create(userId, {
      title: 'Specific Note',
      storageId,
    });

    const found = await noteService.findOne(userId, note.id);
    expect(found.id).toBe(note.id);
    expect(found.title).toBe('Specific Note');
  });

  it('findOne throws NotFoundException for foreign note', async () => {
    const { userId: userId1, storageId } = await createUserWithStorage();
    const { userId: userId2 } = await createUserWithStorage();

    const note = await noteService.create(userId1, {
      title: 'Private',
      storageId,
    });

    await expect(noteService.findOne(userId2, note.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('update persists changes', async () => {
    const { userId, storageId } = await createUserWithStorage();

    const note = await noteService.create(userId, {
      title: 'Original',
      content: 'Original content',
      storageId,
    });

    const updated = await noteService.update(userId, note.id, {
      title: 'Updated',
      content: 'Updated content',
    });

    expect(updated.title).toBe('Updated');
    expect(updated.content).toBe('Updated content');

    const fromDb = await ctx.prisma.db.note.findUnique({
      where: { id: note.id },
    });
    expect(fromDb?.title).toBe('Updated');
  });

  it('remove hard-deletes the note', async () => {
    const { userId, storageId } = await createUserWithStorage();

    const note = await noteService.create(userId, {
      title: 'ToDelete',
      storageId,
    });

    await noteService.remove(userId, note.id);

    const fromDb = await ctx.prisma.db.note.findUnique({
      where: { id: note.id },
    });
    expect(fromDb).toBeNull();
  });

  it('create throws NotFoundException when storageId does not belong to user', async () => {
    const { userId: userId1 } = await createUserWithStorage();
    const { storageId: foreignStorageId } = await createUserWithStorage();

    await expect(
      noteService.create(userId1, {
        title: 'Bad Note',
        storageId: foreignStorageId,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('content defaults to empty string when not provided', async () => {
    const { userId, storageId } = await createUserWithStorage();

    const note = await noteService.create(userId, {
      title: 'No Content',
      storageId,
    });

    expect(note.content).toBe('');
  });
});
