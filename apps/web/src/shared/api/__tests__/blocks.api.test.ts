import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/api/http-client', () => ({
	request: vi.fn(),
}));

import { request } from '@/shared/api/http-client';
import { blocksApi } from '../blocks.api';

const mockRequest = request as ReturnType<typeof vi.fn>;

const mockBlock = {
	id: 'b1',
	title: 'Test Block',
	content: 'Content',
	type: 'NOTE',
	visibility: 'PRIVATE',
	status: 'ACTIVE',
	tags: [],
	userId: 'u1',
	createdAt: '2026-01-01T00:00:00.000Z',
	updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('blocksApi', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getBlocks', () => {
		it('calls GET /blocks and returns array', async () => {
			mockRequest.mockResolvedValue([mockBlock]);

			const result = await blocksApi.getBlocks();

			expect(mockRequest).toHaveBeenCalledWith('/blocks');
			expect(result).toEqual([mockBlock]);
		});

		it('returns empty array when API returns []', async () => {
			mockRequest.mockResolvedValue([]);

			const result = await blocksApi.getBlocks();

			expect(result).toEqual([]);
		});
	});

	describe('getBlock', () => {
		it('calls GET /blocks/:id and returns block', async () => {
			mockRequest.mockResolvedValue(mockBlock);

			const result = await blocksApi.getBlock('b1');

			expect(mockRequest).toHaveBeenCalledWith('/blocks/b1');
			expect(result).toEqual(mockBlock);
		});
	});

	describe('createBlock', () => {
		it('calls POST /blocks with body', async () => {
			mockRequest.mockResolvedValue(mockBlock);
			const body = { title: 'Test Block', content: 'Content' };

			const result = await blocksApi.createBlock(body);

			expect(mockRequest).toHaveBeenCalledWith('/blocks', {
				method: 'POST',
				body,
			});
			expect(result).toEqual(mockBlock);
		});
	});

	describe('updateBlock', () => {
		it('calls PATCH /blocks/:id with body', async () => {
			const updated = { ...mockBlock, title: 'Updated' };
			mockRequest.mockResolvedValue(updated);
			const body = { title: 'Updated' };

			const result = await blocksApi.updateBlock('b1', body);

			expect(mockRequest).toHaveBeenCalledWith('/blocks/b1', {
				method: 'PATCH',
				body,
			});
			expect(result.title).toBe('Updated');
		});
	});

	describe('deleteBlock', () => {
		it('calls DELETE /blocks/:id', async () => {
			mockRequest.mockResolvedValue(mockBlock);

			const result = await blocksApi.deleteBlock('b1');

			expect(mockRequest).toHaveBeenCalledWith('/blocks/b1', {
				method: 'DELETE',
			});
			expect(result).toEqual(mockBlock);
		});
	});

	describe('promoteToTodo', () => {
		it('calls POST /todos/from-block/:id with priority', async () => {
			const mockTodo = { id: 't1', title: 'Test', priority: 'HIGH' };
			mockRequest.mockResolvedValue(mockTodo);

			const result = await blocksApi.promoteToTodo('b1', 'HIGH');

			expect(mockRequest).toHaveBeenCalledWith('/todos/from-block/b1', {
				method: 'POST',
				body: { priority: 'HIGH' },
			});
			expect(result).toEqual(mockTodo);
		});

		it('calls POST /todos/from-block/:id without priority', async () => {
			const mockTodo = { id: 't1', title: 'Test', priority: 'LOWEST' };
			mockRequest.mockResolvedValue(mockTodo);

			await blocksApi.promoteToTodo('b1');

			expect(mockRequest).toHaveBeenCalledWith('/todos/from-block/b1', {
				method: 'POST',
				body: { priority: undefined },
			});
		});
	});
});
