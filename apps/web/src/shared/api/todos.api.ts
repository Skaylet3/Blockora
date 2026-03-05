import { request } from './http-client';

export type TodoPriority = 'HIGHEST' | 'HIGH' | 'MEDIUM' | 'LOW' | 'LOWEST';
export type TodoStatus = 'ACTIVE' | 'COMPLETED';

export interface TodoResponse {
	id: string;
	userId: string;
	title: string;
	description: string | null;
	priority: TodoPriority;
	status: TodoStatus;
	createdAt: string;
	updatedAt: string;
}

export interface CreateTodoBody {
	title: string;
	description?: string;
	priority?: TodoPriority;
}

export interface UpdateTodoBody {
	title?: string;
	description?: string;
	priority?: TodoPriority;
	status?: TodoStatus;
}

export const PRIORITY_TO_UI: Record<TodoPriority, 1 | 2 | 3 | 4 | 5> = {
	HIGHEST: 1,
	HIGH: 2,
	MEDIUM: 3,
	LOW: 4,
	LOWEST: 5,
};

export const UI_TO_PRIORITY: Record<1 | 2 | 3 | 4 | 5, TodoPriority> = {
	1: 'HIGHEST',
	2: 'HIGH',
	3: 'MEDIUM',
	4: 'LOW',
	5: 'LOWEST',
};

export const todosApi = {
	getTodos(status?: TodoStatus): Promise<TodoResponse[]> {
		const query = status ? `?status=${status}` : '';
		return request<TodoResponse[]>(`/todos${query}`);
	},

	getTodo(id: string): Promise<TodoResponse> {
		return request<TodoResponse>(`/todos/${id}`);
	},

	createTodo(body: CreateTodoBody): Promise<TodoResponse> {
		return request<TodoResponse>('/todos', { method: 'POST', body });
	},

	updateTodo(id: string, body: UpdateTodoBody): Promise<TodoResponse> {
		return request<TodoResponse>(`/todos/${id}`, { method: 'PATCH', body });
	},

	deleteTodo(id: string): Promise<TodoResponse> {
		return request<TodoResponse>(`/todos/${id}`, { method: 'DELETE' });
	},
};
