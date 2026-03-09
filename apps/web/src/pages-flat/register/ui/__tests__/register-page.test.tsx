import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
	useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

vi.mock('sonner', () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/shared/api/auth.api', () => ({
	authApi: { register: vi.fn() },
}));

vi.mock('@/shared/api/http-client', () => ({
	ApiRequestError: class ApiRequestError extends Error {
		statusCode: number;
		messages: string[];
		constructor(message: string, statusCode = 400, messages: string[] = []) {
			super(message);
			this.statusCode = statusCode;
			this.messages = messages;
		}
	},
}));

vi.mock('@/shared/lib/token-storage', () => ({
	setTokens: vi.fn(),
}));

vi.mock('@marsidev/react-turnstile', () => ({
	Turnstile: ({ onSuccess }: { onSuccess: (token: string) => void }) => {
		React.useEffect(() => { onSuccess('test-captcha-token'); }, []);
		return <div data-testid="turnstile-widget" />;
	},
}));

import * as React from 'react';
import { authApi } from '@/shared/api/auth.api';
import { ApiRequestError } from '@/shared/api/http-client';
import { toast } from 'sonner';
import { RegisterPage } from '../register-page';

const mockRegister = authApi.register as ReturnType<typeof vi.fn>;

describe('RegisterPage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders email, password, name fields and create account button', () => {
		render(<RegisterPage />);

		expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
	});

	it('renders link to login page', () => {
		render(<RegisterPage />);

		expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');
	});

	it('calls authApi.register on submit and navigates on success', async () => {
		const user = userEvent.setup();
		mockRegister.mockResolvedValue({ accessToken: 'at', refreshToken: 'rt' });

		render(<RegisterPage />);

		await user.type(screen.getByLabelText(/email/i), 'a@b.com');
		await user.type(screen.getByLabelText(/password/i), 'pass1234');
		await user.click(screen.getByRole('button', { name: /create account/i }));

		await waitFor(() => {
			expect(mockRegister).toHaveBeenCalledWith({
				email: 'a@b.com',
				password: 'pass1234',
				displayName: undefined,
				captchaToken: 'test-captcha-token',
			});
		});
		await waitFor(() => {
			expect(mockPush).toHaveBeenCalledWith('/');
		});
	});

	it('includes displayName when provided', async () => {
		const user = userEvent.setup();
		mockRegister.mockResolvedValue({ accessToken: 'at', refreshToken: 'rt' });

		render(<RegisterPage />);

		await user.type(screen.getByLabelText(/email/i), 'a@b.com');
		await user.type(screen.getByLabelText(/password/i), 'pass1234');
		await user.type(screen.getByLabelText(/name/i), 'Bob');
		await user.click(screen.getByRole('button', { name: /create account/i }));

		await waitFor(() => {
			expect(mockRegister).toHaveBeenCalledWith({
				email: 'a@b.com',
				password: 'pass1234',
				displayName: 'Bob',
				captchaToken: 'test-captcha-token',
			});
		});
	});

	it('shows error toast for short password', async () => {
		const user = userEvent.setup();

		render(<RegisterPage />);

		await user.type(screen.getByLabelText(/email/i), 'a@b.com');
		await user.type(screen.getByLabelText(/password/i), 'short');
		await user.click(screen.getByRole('button', { name: /create account/i }));

		expect(toast.error).toHaveBeenCalledWith('Password must be at least 8 characters.');
		expect(mockRegister).not.toHaveBeenCalled();
	});

	it('shows specific error for 409 conflict (email exists)', async () => {
		const user = userEvent.setup();
		mockRegister.mockRejectedValue(new ApiRequestError('Conflict', 409));

		render(<RegisterPage />);

		await user.type(screen.getByLabelText(/email/i), 'a@b.com');
		await user.type(screen.getByLabelText(/password/i), 'pass1234');
		await user.click(screen.getByRole('button', { name: /create account/i }));

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith('An account with this email already exists.');
		});
	});

	it('shows creating account text while loading', async () => {
		const user = userEvent.setup();
		mockRegister.mockReturnValue(new Promise(() => {}));

		render(<RegisterPage />);

		await user.type(screen.getByLabelText(/email/i), 'a@b.com');
		await user.type(screen.getByLabelText(/password/i), 'pass1234');
		await user.click(screen.getByRole('button', { name: /create account/i }));

		expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
	});

	it('disables submit button when no CAPTCHA token', async () => {
		const turnstileMock = await import('@marsidev/react-turnstile');
		const original = turnstileMock.Turnstile;
		const NoOpTurnstile = () => <div data-testid="turnstile-widget" />;
		NoOpTurnstile.displayName = 'NoOpTurnstile';
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(turnstileMock as Record<string, any>).Turnstile = NoOpTurnstile;

		render(<RegisterPage />);

		expect(screen.getByRole('button', { name: /create account/i })).toBeDisabled();

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(turnstileMock as Record<string, any>).Turnstile = original;
	});
});
