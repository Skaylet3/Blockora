import { request } from './http-client';

export interface StorageResponse {
	id: string;
	name: string;
	parentId: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface CreateStorageBody {
	name: string;
	parentId?: string;
}

export const storagesApi = {
	getStorages(): Promise<StorageResponse[]> {
		return request<StorageResponse[]>('/storages');
	},

	createStorage(body: CreateStorageBody): Promise<StorageResponse> {
		return request<StorageResponse>('/storages', { method: 'POST', body });
	},

	deleteStorage(id: string): Promise<void> {
		return request<void>(`/storages/${id}`, { method: 'DELETE' });
	},
};
