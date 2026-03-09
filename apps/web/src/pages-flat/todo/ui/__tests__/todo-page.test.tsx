import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/widgets/navbar', () => ({
	Navbar: () => null,
}));

vi.mock('sonner', () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/shared/api/todos.api', () => ({
	todosApi: {
		getTodos: vi.fn(),
		createTodo: vi.fn(),
		updateTodo: vi.fn(),
		deleteTodo: vi.fn(),
	},
	PRIORITY_TO_UI: {
		HIGHEST: 1,
		HIGH: 2,
		MEDIUM: 3,
		LOW: 4,
		LOWEST: 5,
	},
}));

import { todosApi } from '@/shared/api/todos.api';
import { toast } from 'sonner';
import { TodoPage } from '../todo-page';

const mockGetTodos = todosApi.getTodos as ReturnType<typeof vi.fn>;
const _mockCreateTodo = todosApi.createTodo as ReturnType<typeof vi.fn>;
const mockUpdateTodo = todosApi.updateTodo as ReturnType<typeof vi.fn>;
const mockDeleteTodo = todosApi.deleteTodo as ReturnType<typeof vi.fn>;

const mockTodo = {
	id: 't1',
	userId: 'u1',
	title: 'Test Todo',
	description: 'A description',
	priority: 'LOWEST' as const,
	status: 'ACTIVE' as const,
	createdAt: '2026-01-01T00:00:00.000Z',
	updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('TodoPage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('shows loading skeleton while getTodos is pending', () => {
		mockGetTodos.mockReturnValue(new Promise(() => {}));

		render(<TodoPage />);

		expect(screen.getByText('Todo List')).toBeInTheDocument();
	});

	it('renders todo items when API returns data', async () => {
		mockGetTodos.mockResolvedValue([mockTodo]);

		render(<TodoPage />);

		await waitFor(() => {
			expect(screen.getByText('Test Todo')).toBeInTheDocument();
		});
		expect(screen.getByText('A description')).toBeInTheDocument();
	});

	it('shows empty state when no todos exist', async () => {
		mockGetTodos.mockResolvedValue([]);

		render(<TodoPage />);

		await waitFor(() => {
			expect(screen.getByText('All caught up!')).toBeInTheDocument();
		});
	});

	it('shows error state when getTodos fails', async () => {
		mockGetTodos.mockRejectedValue(new Error('Network error'));

		render(<TodoPage />);

		await waitFor(() => {
			expect(screen.getByText('Failed to load todos')).toBeInTheDocument();
		});

		expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
	});

	it('renders filter tabs (All, Active, Completed)', async () => {
		mockGetTodos.mockResolvedValue([]);

		render(<TodoPage />);

		expect(screen.getByText('All')).toBeInTheDocument();
		expect(screen.getByText('Active')).toBeInTheDocument();
		expect(screen.getByText('Completed')).toBeInTheDocument();
	});

	it('filters todos when clicking filter tabs', async () => {
		const user = userEvent.setup();
		mockGetTodos.mockResolvedValue([]);

		render(<TodoPage />);

		await waitFor(() => {
			expect(screen.getByText('All caught up!')).toBeInTheDocument();
		});

		await user.click(screen.getByText('Active'));

		await waitFor(() => {
			expect(mockGetTodos).toHaveBeenCalledWith('ACTIVE');
		});
	});

	it('deletes a todo when delete button is clicked', async () => {
		const user = userEvent.setup();
		mockGetTodos.mockResolvedValue([mockTodo]);
		mockDeleteTodo.mockResolvedValue(mockTodo);

		render(<TodoPage />);

		await waitFor(() => {
			expect(screen.getByText('Test Todo')).toBeInTheDocument();
		});

		const deleteButton = screen.getByTitle('Delete');
		await user.click(deleteButton);

		await waitFor(() => {
			expect(mockDeleteTodo).toHaveBeenCalledWith('t1');
		});
		expect(toast.success).toHaveBeenCalledWith('Todo deleted');
	});

	it('toggles todo completion status', async () => {
		const user = userEvent.setup();
		mockGetTodos.mockResolvedValue([mockTodo]);
		mockUpdateTodo.mockResolvedValue({ ...mockTodo, status: 'COMPLETED' });

		render(<TodoPage />);

		await waitFor(() => {
			expect(screen.getByText('Test Todo')).toBeInTheDocument();
		});

		// The checkbox button is the first interactive element in the todo card
		const todoCard = screen.getByText('Test Todo').closest('[class*="rounded-xl"]')!;
		const checkboxButton = todoCard.querySelector('button')!;
		await user.click(checkboxButton);

		await waitFor(() => {
			expect(mockUpdateTodo).toHaveBeenCalledWith('t1', { status: 'COMPLETED' });
		});
	});

	it('shows error toast when delete fails', async () => {
		const user = userEvent.setup();
		mockGetTodos.mockResolvedValue([mockTodo]);
		mockDeleteTodo.mockRejectedValue(new Error('fail'));

		render(<TodoPage />);

		await waitFor(() => {
			expect(screen.getByText('Test Todo')).toBeInTheDocument();
		});

		await user.click(screen.getByTitle('Delete'));

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith('Failed to delete todo');
		});
	});
});
