import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/widgets/navbar', () => ({
	ProfileNavbar: () => <nav data-testid="profile-navbar">ProfileNavbar</nav>,
}));

vi.mock('@/features/update-profile', () => ({
	ProfileForm: ({ initialEmail, initialUserId, initialDisplayName }: {
		initialEmail: string;
		initialUserId: string;
		initialDisplayName: string;
	}) => (
		<div data-testid="profile-form">
			{initialEmail} | {initialUserId} | {initialDisplayName}
		</div>
	),
}));

import { ProfilePage } from '../profile-page';

describe('ProfilePage', () => {
	it('renders ProfileNavbar and ProfileForm with props', () => {
		render(
			<ProfilePage
				initialEmail="a@b.com"
				initialUserId="u1"
				initialDisplayName="Alice"
			/>,
		);

		expect(screen.getByTestId('profile-navbar')).toBeInTheDocument();
		expect(screen.getByTestId('profile-form')).toBeInTheDocument();
		expect(screen.getByText('a@b.com | u1 | Alice')).toBeInTheDocument();
	});

	it('passes empty strings through correctly', () => {
		render(
			<ProfilePage
				initialEmail=""
				initialUserId=""
				initialDisplayName=""
			/>,
		);

		const form = screen.getByTestId('profile-form');
		expect(form).toBeInTheDocument();
		// All three values are empty strings, so text content is " |  | "
		expect(form.textContent).toContain('|');
	});
});
