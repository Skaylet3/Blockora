import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/api/http-client', () => ({
	request: vi.fn(),
}));

import { request } from '@/shared/api/http-client';
import {
	PRIORITY_TO_UI,
	TodoPriority,
	todosApi,
	UI_TO_PRIORITY,
} from '../todos.api';

const mockRequest = request as ReturnType<typeof vi.fn>;

describe('todosApi', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getTodos', () => {
		it('calls GET /todos without status param when called with no args', async () => {
			mockRequest.mockResolvedValue([]);
			await todosApi.getTodos();
			expect(mockRequest).toHaveBeenCalledWith('/todos');
		});

		it('calls GET /todos?status=ACTIVE when called with ACTIVE', async () => {
			mockRequest.mockResolvedValue([]);
			await todosApi.getTodos('ACTIVE');
			expect(mockRequest).toHaveBeenCalledWith('/todos?status=ACTIVE');
		});

		it('calls GET /todos?status=COMPLETED when called with COMPLETED', async () => {
			mockRequest.mockResolvedValue([]);
			await todosApi.getTodos('COMPLETED');
			expect(mockRequest).toHaveBeenCalledWith('/todos?status=COMPLETED');
		});
	});

	describe('getTodo', () => {
		it('calls GET /todos/:id', async () => {
			mockRequest.mockResolvedValue({});
			await todosApi.getTodo('abc-123');
			expect(mockRequest).toHaveBeenCalledWith('/todos/abc-123');
		});
	});

	describe('createTodo', () => {
		it('calls POST /todos with body', async () => {
			const body = { title: 'My task', priority: 'HIGH' as TodoPriority };
			mockRequest.mockResolvedValue({});
			await todosApi.createTodo(body);
			expect(mockRequest).toHaveBeenCalledWith('/todos', {
				method: 'POST',
				body,
			});
		});
	});

	describe('updateTodo', () => {
		it('calls PATCH /todos/:id with body', async () => {
			const body = { status: 'COMPLETED' as const };
			mockRequest.mockResolvedValue({});
			await todosApi.updateTodo('abc-123', body);
			expect(mockRequest).toHaveBeenCalledWith('/todos/abc-123', {
				method: 'PATCH',
				body,
			});
		});
	});

	describe('deleteTodo', () => {
		it('calls DELETE /todos/:id', async () => {
			mockRequest.mockResolvedValue({});
			await todosApi.deleteTodo('abc-123');
			expect(mockRequest).toHaveBeenCalledWith('/todos/abc-123', {
				method: 'DELETE',
			});
		});
	});
});

describe('PRIORITY_TO_UI', () => {
	it('maps all 5 TodoPriority values to 1-5', () => {
		expect(PRIORITY_TO_UI['HIGHEST']).toBe(1);
		expect(PRIORITY_TO_UI['HIGH']).toBe(2);
		expect(PRIORITY_TO_UI['MEDIUM']).toBe(3);
		expect(PRIORITY_TO_UI['LOW']).toBe(4);
		expect(PRIORITY_TO_UI['LOWEST']).toBe(5);
	});
});

describe('UI_TO_PRIORITY', () => {
	it('maps all 5 numbers to the correct TodoPriority strings', () => {
		expect(UI_TO_PRIORITY[1]).toBe('HIGHEST');
		expect(UI_TO_PRIORITY[2]).toBe('HIGH');
		expect(UI_TO_PRIORITY[3]).toBe('MEDIUM');
		expect(UI_TO_PRIORITY[4]).toBe('LOW');
		expect(UI_TO_PRIORITY[5]).toBe('LOWEST');
	});

	it('is the inverse of PRIORITY_TO_UI', () => {
		const priorities: TodoPriority[] = [
			'HIGHEST',
			'HIGH',
			'MEDIUM',
			'LOW',
			'LOWEST',
		];
		for (const p of priorities) {
			expect(UI_TO_PRIORITY[PRIORITY_TO_UI[p]]).toBe(p);
		}
	});
});
