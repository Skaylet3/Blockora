import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/widgets/navbar', () => ({
	Navbar: () => <nav data-testid="navbar">Navbar</nav>,
}));

vi.mock('@/widgets/blocks-list', () => ({
	BlocksClient: ({ initialBlocks }: { initialBlocks: unknown[] }) => (
		<div data-testid="blocks-client">Blocks: {initialBlocks.length}</div>
	),
}));

import { DashboardPage } from '../dashboard-page';

const mockBlocks = [
	{
		id: 'b1',
		title: 'Block 1',
		content: 'Content 1',
		type: 'NOTE',
		visibility: 'PRIVATE',
		status: 'ACTIVE',
		tags: [],
		userId: 'u1',
		createdAt: '2026-01-01T00:00:00.000Z',
		updatedAt: '2026-01-01T00:00:00.000Z',
	},
];

describe('DashboardPage', () => {
	it('renders Navbar and BlocksClient with provided blocks', () => {
		render(<DashboardPage blocks={mockBlocks} />);

		expect(screen.getByTestId('navbar')).toBeInTheDocument();
		expect(screen.getByTestId('blocks-client')).toBeInTheDocument();
		expect(screen.getByText('Blocks: 1')).toBeInTheDocument();
	});

	it('renders empty state when no blocks provided', () => {
		render(<DashboardPage blocks={[]} />);

		expect(screen.getByText('Blocks: 0')).toBeInTheDocument();
	});
});
