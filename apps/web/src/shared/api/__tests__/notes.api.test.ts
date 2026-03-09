import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/api/http-client', () => ({
	request: vi.fn(),
}));

import { request } from '@/shared/api/http-client';
import { notesApi } from '../notes.api';

const mockRequest = request as ReturnType<typeof vi.fn>;

const mockNote = {
	id: 'note-1',
	title: 'My Note',
	content: 'Hello world',
	storageId: 'storage-1',
	createdAt: '2026-01-01T00:00:00.000Z',
	updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('notesApi', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getNotesByStorage', () => {
		it('calls GET /notes?storageId=:id and returns array', async () => {
			mockRequest.mockResolvedValue([mockNote]);

			const result = await notesApi.getNotesByStorage('storage-1');

			expect(mockRequest).toHaveBeenCalledWith('/notes?storageId=storage-1');
			expect(result).toEqual([mockNote]);
		});

		it('returns empty array when storage has no notes', async () => {
			mockRequest.mockResolvedValue([]);

			const result = await notesApi.getNotesByStorage('storage-empty');

			expect(result).toEqual([]);
		});
	});

	describe('createNote', () => {
		it('calls POST /notes with body and returns created note', async () => {
			const body = { title: 'New Note', storageId: 'storage-1' };
			mockRequest.mockResolvedValue(mockNote);

			const result = await notesApi.createNote(body);

			expect(mockRequest).toHaveBeenCalledWith('/notes', {
				method: 'POST',
				body,
			});
			expect(result).toEqual(mockNote);
		});

		it('calls POST /notes with optional content', async () => {
			const body = { title: 'New Note', content: 'Some content', storageId: 'storage-1' };
			mockRequest.mockResolvedValue({ ...mockNote, content: 'Some content' });

			await notesApi.createNote(body);

			expect(mockRequest).toHaveBeenCalledWith('/notes', {
				method: 'POST',
				body,
			});
		});
	});

	describe('updateNote', () => {
		it('calls PATCH /notes/:id with body and returns updated note', async () => {
			const body = { title: 'Updated Title' };
			mockRequest.mockResolvedValue({ ...mockNote, title: 'Updated Title' });

			const result = await notesApi.updateNote('note-1', body);

			expect(mockRequest).toHaveBeenCalledWith('/notes/note-1', {
				method: 'PATCH',
				body,
			});
			expect(result.title).toBe('Updated Title');
		});
	});

	describe('updateNote — content only', () => {
		it('calls PATCH /notes/:id with content-only body', async () => {
			const body = { content: 'New content' };
			mockRequest.mockResolvedValue({ ...mockNote, content: 'New content' });

			const result = await notesApi.updateNote('note-1', body);

			expect(mockRequest).toHaveBeenCalledWith('/notes/note-1', {
				method: 'PATCH',
				body,
			});
			expect(result.content).toBe('New content');
		});
	});

	describe('deleteNote', () => {
		it('calls DELETE /notes/:id', async () => {
			mockRequest.mockResolvedValue(undefined);

			await notesApi.deleteNote('note-1');

			expect(mockRequest).toHaveBeenCalledWith('/notes/note-1', {
				method: 'DELETE',
			});
		});
	});

	describe('error propagation', () => {
		it('getNotesByStorage propagates request errors', async () => {
			mockRequest.mockRejectedValue(new Error('Unauthorized'));

			await expect(notesApi.getNotesByStorage('s1')).rejects.toThrow(
				'Unauthorized',
			);
		});

		it('createNote propagates request errors', async () => {
			mockRequest.mockRejectedValue(new Error('Validation failed'));

			await expect(
				notesApi.createNote({ title: 'Bad', storageId: 's1' }),
			).rejects.toThrow('Validation failed');
		});

		it('updateNote propagates request errors', async () => {
			mockRequest.mockRejectedValue(new Error('Not found'));

			await expect(
				notesApi.updateNote('missing', { title: 'X' }),
			).rejects.toThrow('Not found');
		});

		it('deleteNote propagates request errors', async () => {
			mockRequest.mockRejectedValue(new Error('Forbidden'));

			await expect(notesApi.deleteNote('note-1')).rejects.toThrow('Forbidden');
		});
	});
});
