import type { Block } from '@/entities/block';
import { request } from './http-client';

export interface CreateBlockBody {
	title: string;
	content: string;
	type?: Block['type'];
	visibility?: Block['visibility'];
	tags?: string[];
}

export interface UpdateBlockBody {
	title?: string;
	content?: string;
	type?: Block['type'];
	visibility?: Block['visibility'];
	tags?: string[];
	status?: Block['status'];
}

export const blocksApi = {
	getBlocks(): Promise<Block[]> {
		return request<Block[]>('/blocks');
	},

	getBlock(id: string): Promise<Block> {
		return request<Block>(`/blocks/${id}`);
	},

	createBlock(body: CreateBlockBody): Promise<Block> {
		return request<Block>('/blocks', { method: 'POST', body });
	},

	updateBlock(id: string, body: UpdateBlockBody): Promise<Block> {
		return request<Block>(`/blocks/${id}`, { method: 'PATCH', body });
	},

	deleteBlock(id: string): Promise<Block> {
		return request<Block>(`/blocks/${id}`, { method: 'DELETE' });
	},
};
