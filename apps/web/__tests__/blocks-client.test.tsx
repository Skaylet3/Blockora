import type { Block } from '@/entities/block';
import { BlocksClient } from '@/widgets/blocks-list';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createBlock, resetSeq } from './fixtures';

vi.mock('sonner', () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
		info: vi.fn(),
	},
}));

vi.mock('@/shared/api/blocks.api', () => ({
	blocksApi: {
		getBlocks: vi.fn(),
		createBlock: vi.fn(),
		updateBlock: vi.fn(),
		deleteBlock: vi.fn(),
	},
}));

vi.mock('@/features/edit-block', () => ({
	EditBlockDialog: () => null,
}));

vi.mock('@/features/delete-block', () => ({
	DeleteBlockButton: () => null,
}));

import { blocksApi } from '@/shared/api/blocks.api';

const DASHBOARD_BLOCKS: Block[] = [
	createBlock({
		id: 'b1',
		title: 'React Hooks Guide',
		content: 'useState and useEffect patterns',
		type: 'NOTE',
		tags: ['react'],
		status: 'ACTIVE',
	}),
	createBlock({
		id: 'b2',
		title: 'Deploy Checklist',
		content: 'Steps before going to production',
		type: 'TASK',
		tags: ['devops'],
		status: 'ACTIVE',
	}),
	createBlock({
		id: 'b3',
		title: 'Auth Snippet',
		content: 'JWT decode helper function',
		type: 'SNIPPET',
		tags: ['auth', 'jwt'],
		status: 'ACTIVE',
	}),
	createBlock({
		id: 'b4',
		title: 'Old Note',
		content: 'This note was archived',
		type: 'NOTE',
		tags: [],
		status: 'ARCHIVED',
	}),
	createBlock({
		id: 'b5',
		title: 'Completed Task',
		content: 'Already done',
		type: 'TASK',
		tags: ['devops'],
		status: 'ARCHIVED',
	}),
];

beforeEach(() => {
	resetSeq();
	vi.mocked(blocksApi.getBlocks).mockResolvedValue(DASHBOARD_BLOCKS);
});

describe('BlocksClient — filtering and search (US3)', () => {
	it('search by query narrows results to matching blocks', async () => {
		const user = userEvent.setup();
		render(<BlocksClient initialBlocks={[]} />);

		await waitFor(() => screen.getByText('React Hooks Guide'));

		await user.type(screen.getByPlaceholderText('Search blocks...'), 'React');

		expect(screen.getByText('React Hooks Guide')).toBeInTheDocument();
		expect(screen.queryByText('Deploy Checklist')).not.toBeInTheDocument();
		expect(screen.queryByText('Auth Snippet')).not.toBeInTheDocument();
	});

	it('type filter shows only blocks of the selected type', async () => {
		const user = userEvent.setup();
		render(<BlocksClient initialBlocks={[]} />);

		await waitFor(() => screen.getByText('React Hooks Guide'));

		// The type filter is a Radix UI Select (role="combobox") — open it, then click the option
		const typeSelect = screen.getAllByRole('combobox')[0];
		await user.click(typeSelect);
		await user.click(await screen.findByRole('option', { name: 'Note' }));

		expect(screen.getByText('React Hooks Guide')).toBeInTheDocument();
		expect(screen.queryByText('Deploy Checklist')).not.toBeInTheDocument();
		expect(screen.queryByText('Auth Snippet')).not.toBeInTheDocument();
	});

	it('Archived tab shows only archived blocks', async () => {
		const user = userEvent.setup();
		render(<BlocksClient initialBlocks={[]} />);

		await waitFor(() => screen.getByText('React Hooks Guide'));

		await user.click(screen.getByRole('button', { name: /Archived/ }));

		expect(screen.getByText('Old Note')).toBeInTheDocument();
		expect(screen.getByText('Completed Task')).toBeInTheDocument();
		expect(screen.queryByText('React Hooks Guide')).not.toBeInTheDocument();
		expect(screen.queryByText('Deploy Checklist')).not.toBeInTheDocument();
	});

	it('Clear filters restores all active blocks after a no-match search', async () => {
		const user = userEvent.setup();
		render(<BlocksClient initialBlocks={[]} />);

		await waitFor(() => screen.getByText('React Hooks Guide'));

		await user.type(
			screen.getByPlaceholderText('Search blocks...'),
			'zzznomatch',
		);

		expect(
			screen.getByText('No blocks match your filters'),
		).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: /clear filters/i }));

		expect(screen.getByText('React Hooks Guide')).toBeInTheDocument();
		expect(screen.getByText('Deploy Checklist')).toBeInTheDocument();
		expect(screen.getByText('Auth Snippet')).toBeInTheDocument();
	});
});

describe('BlocksClient — edge cases', () => {
	it('shows empty state when search matches zero blocks', async () => {
		const user = userEvent.setup();
		render(<BlocksClient initialBlocks={[]} />);

		await waitFor(() => screen.getByText('React Hooks Guide'));

		await user.type(
			screen.getByPlaceholderText('Search blocks...'),
			'zzznomatch',
		);

		expect(
			screen.getByText('No blocks match your filters'),
		).toBeInTheDocument();
		expect(screen.queryByText('React Hooks Guide')).not.toBeInTheDocument();
	});

	it('shows empty active state when all blocks are archived', async () => {
		const allArchived: Block[] = DASHBOARD_BLOCKS.map(b => ({
			...b,
			status: 'ARCHIVED' as const,
		}));
		vi.mocked(blocksApi.getBlocks).mockResolvedValueOnce(allArchived);

		render(<BlocksClient initialBlocks={[]} />);

		// Active tab is default — no active blocks → empty state
		await waitFor(() => screen.getByText('No blocks yet'));
	});
});
