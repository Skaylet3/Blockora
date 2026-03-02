import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfileForm } from '../profile-form';

vi.mock('sonner', () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
		info: vi.fn(),
	},
}));

vi.mock('@/shared/api/auth.api', () => ({
	authApi: {
		getMe: vi.fn(),
		updateProfile: vi.fn(),
	},
}));

import { authApi } from '@/shared/api/auth.api';
import { toast } from 'sonner';

const mockAuthApi = authApi as {
	getMe: ReturnType<typeof vi.fn>;
	updateProfile: ReturnType<typeof vi.fn>;
};
const mockToast = toast as {
	success: ReturnType<typeof vi.fn>;
	error: ReturnType<typeof vi.fn>;
	info: ReturnType<typeof vi.fn>;
};

describe('ProfileForm', () => {
	const user = userEvent.setup();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('with initial props', () => {
		it('renders pre-filled Name and Email immediately without calling getMe', () => {
			render(
				<ProfileForm initialEmail='a@b.com' initialUserId='u1' initialDisplayName='Alice' />,
			);

			expect(screen.getByLabelText('Name')).toHaveValue('Alice');
			expect(screen.getByLabelText('Email')).toHaveValue('a@b.com');
			expect(mockAuthApi.getMe).not.toHaveBeenCalled();
		});
	});

	describe('without initial props (client-side fetch)', () => {
		it('shows loading placeholder then populates fields from getMe', async () => {
			mockAuthApi.getMe.mockResolvedValue({
				userId: 'u1',
				email: 'a@b.com',
				displayName: 'Bob',
			});

			render(<ProfileForm initialEmail='' initialUserId='' initialDisplayName='' />);

			expect(screen.getByLabelText('Name')).toHaveAttribute('placeholder', 'Loading...');

			await waitFor(() => expect(screen.getByLabelText('Name')).toHaveValue('Bob'));
			expect(screen.getByLabelText('Email')).toHaveValue('a@b.com');
		});
	});

	describe('save', () => {
		it('calls updateProfile and shows success toast', async () => {
			mockAuthApi.updateProfile.mockResolvedValue({
				userId: 'u1',
				email: 'a@b.com',
				displayName: 'Updated',
			});

			render(
				<ProfileForm initialEmail='a@b.com' initialUserId='u1' initialDisplayName='Alice' />,
			);

			await user.clear(screen.getByLabelText('Name'));
			await user.type(screen.getByLabelText('Name'), 'Updated');
			await user.click(screen.getByRole('button', { name: 'Save Changes' }));

			await waitFor(() =>
				expect(mockAuthApi.updateProfile).toHaveBeenCalledWith({ displayName: 'Updated' }),
			);
			expect(mockToast.success).toHaveBeenCalledWith('Profile saved.');
		});

		it('shows error toast with API message on failure', async () => {
			mockAuthApi.updateProfile.mockRejectedValue({ messages: ['Display name too long'] });

			render(
				<ProfileForm initialEmail='a@b.com' initialUserId='u1' initialDisplayName='Alice' />,
			);

			await user.click(screen.getByRole('button', { name: 'Save Changes' }));

			await waitFor(() =>
				expect(mockToast.error).toHaveBeenCalledWith('Display name too long'),
			);
		});

		it('shows fallback error toast when no API message', async () => {
			mockAuthApi.updateProfile.mockRejectedValue({});

			render(
				<ProfileForm initialEmail='a@b.com' initialUserId='u1' initialDisplayName='Alice' />,
			);

			await user.click(screen.getByRole('button', { name: 'Save Changes' }));

			await waitFor(() =>
				expect(mockToast.error).toHaveBeenCalledWith('Failed to save profile.'),
			);
		});
	});

	describe('cancel', () => {
		it('reverts Name field to last saved value and shows info toast', async () => {
			render(
				<ProfileForm initialEmail='a@b.com' initialUserId='u1' initialDisplayName='Alice' />,
			);

			await user.clear(screen.getByLabelText('Name'));
			await user.type(screen.getByLabelText('Name'), 'Temporary');
			await user.click(screen.getByRole('button', { name: 'Cancel' }));

			expect(screen.getByLabelText('Name')).toHaveValue('Alice');
			expect(mockToast.info).toHaveBeenCalledWith('Changes discarded.');
		});
	});
});
