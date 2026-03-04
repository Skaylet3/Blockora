import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/widgets/navbar', () => ({
	Navbar: () => null,
}));

vi.mock('sonner', () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

vi.mock('@/shared/api/storages.api', () => ({
	storagesApi: {
		getStorages: vi.fn(),
		createStorage: vi.fn(),
		deleteStorage: vi.fn(),
	},
}));

vi.mock('@/shared/api/notes.api', () => ({
	notesApi: {
		getNotesByStorage: vi.fn(),
		createNote: vi.fn(),
		updateNote: vi.fn(),
		deleteNote: vi.fn(),
	},
}));

import { storagesApi } from '@/shared/api/storages.api';
import { NotesPage } from '../notes-page';

const mockStoragesApi = storagesApi as {
	getStorages: ReturnType<typeof vi.fn>;
	createStorage: ReturnType<typeof vi.fn>;
	deleteStorage: ReturnType<typeof vi.fn>;
};

describe('NotesPage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('shows loading state while getStorages is pending', () => {
		mockStoragesApi.getStorages.mockReturnValue(new Promise(() => {}));

		render(<NotesPage />);

		expect(screen.getByTestId('storages-loading')).toBeInTheDocument();
	});

	it('shows empty sidebar when API resolves with [] — no mock data present', async () => {
		mockStoragesApi.getStorages.mockResolvedValue([]);

		render(<NotesPage />);

		await waitFor(() =>
			expect(screen.queryByTestId('storages-loading')).not.toBeInTheDocument(),
		);

		expect(screen.queryByText('Storage Level 1')).not.toBeInTheDocument();
		expect(screen.queryByText('Storage Level 2')).not.toBeInTheDocument();
	});

	it('shows error message when getStorages rejects', async () => {
		mockStoragesApi.getStorages.mockRejectedValue(new Error('Network error'));

		render(<NotesPage />);

		await waitFor(() =>
			expect(screen.getByText('Network error')).toBeInTheDocument(),
		);
	});

	it('shows real storages when API resolves with data', async () => {
		mockStoragesApi.getStorages.mockResolvedValue([
			{
				id: 's1',
				name: 'My Real Storage',
				parentId: null,
				createdAt: '2026-01-01T00:00:00.000Z',
				updatedAt: '2026-01-01T00:00:00.000Z',
			},
		]);

		render(<NotesPage />);

		await waitFor(() =>
			expect(screen.getByText('My Real Storage')).toBeInTheDocument(),
		);
	});
});
