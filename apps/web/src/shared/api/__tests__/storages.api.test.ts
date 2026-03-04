import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/api/http-client', () => ({
	request: vi.fn(),
}));

import { request } from '@/shared/api/http-client';
import { storagesApi } from '../storages.api';

const mockRequest = request as ReturnType<typeof vi.fn>;

const mockStorage = {
	id: 'abc',
	name: 'My Storage',
	parentId: null,
	createdAt: '2026-01-01T00:00:00.000Z',
	updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('storagesApi', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getStorages', () => {
		it('calls GET /storages and returns array', async () => {
			mockRequest.mockResolvedValue([mockStorage]);

			const result = await storagesApi.getStorages();

			expect(mockRequest).toHaveBeenCalledWith('/storages');
			expect(result).toEqual([mockStorage]);
		});

		it('returns empty array when API returns []', async () => {
			mockRequest.mockResolvedValue([]);

			const result = await storagesApi.getStorages();

			expect(result).toEqual([]);
		});
	});

	describe('createStorage', () => {
		it('calls POST /storages with body and returns created storage', async () => {
			const body = { name: 'New Storage' };
			mockRequest.mockResolvedValue({ ...mockStorage, name: 'New Storage' });

			const result = await storagesApi.createStorage(body);

			expect(mockRequest).toHaveBeenCalledWith('/storages', {
				method: 'POST',
				body,
			});
			expect(result.name).toBe('New Storage');
		});

		it('calls POST /storages with parentId when provided', async () => {
			const body = { name: 'Child Storage', parentId: 'parent-1' };
			mockRequest.mockResolvedValue({ ...mockStorage, parentId: 'parent-1' });

			await storagesApi.createStorage(body);

			expect(mockRequest).toHaveBeenCalledWith('/storages', {
				method: 'POST',
				body,
			});
		});
	});

	describe('deleteStorage', () => {
		it('calls DELETE /storages/:id', async () => {
			mockRequest.mockResolvedValue(undefined);

			await storagesApi.deleteStorage('abc');

			expect(mockRequest).toHaveBeenCalledWith('/storages/abc', {
				method: 'DELETE',
			});
		});
	});
});
