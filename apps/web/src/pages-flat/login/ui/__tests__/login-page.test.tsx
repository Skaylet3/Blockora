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
	authApi: { login: vi.fn() },
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
import { LoginPage } from '../login-page';

const mockLogin = authApi.login as ReturnType<typeof vi.fn>;

describe('LoginPage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders email and password fields and sign in button', () => {
		render(<LoginPage />);

		expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
	});

	it('renders link to register page', () => {
		render(<LoginPage />);

		expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/register');
	});

	it('calls authApi.login on submit and navigates on success', async () => {
		const user = userEvent.setup();
		mockLogin.mockResolvedValue({ accessToken: 'at', refreshToken: 'rt' });

		render(<LoginPage />);

		await user.type(screen.getByLabelText(/email/i), 'a@b.com');
		await user.type(screen.getByLabelText(/password/i), 'pass1234');
		await user.click(screen.getByRole('button', { name: /sign in/i }));

		await waitFor(() => {
			expect(mockLogin).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pass1234', captchaToken: 'test-captcha-token' });
		});
		await waitFor(() => {
			expect(mockPush).toHaveBeenCalledWith('/');
		});
	});

	it('shows error toast when login fails with ApiRequestError', async () => {
		const user = userEvent.setup();
		mockLogin.mockRejectedValue(new ApiRequestError('Invalid credentials', 401));

		render(<LoginPage />);

		await user.type(screen.getByLabelText(/email/i), 'a@b.com');
		await user.type(screen.getByLabelText(/password/i), 'wrong');
		await user.click(screen.getByRole('button', { name: /sign in/i }));

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalled();
		});
	});

	it('shows generic error toast when login fails with unknown error', async () => {
		const user = userEvent.setup();
		mockLogin.mockRejectedValue(new Error('Network error'));

		render(<LoginPage />);

		await user.type(screen.getByLabelText(/email/i), 'a@b.com');
		await user.type(screen.getByLabelText(/password/i), 'pass');
		await user.click(screen.getByRole('button', { name: /sign in/i }));

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith('Failed to sign in. Please try again.');
		});
	});

	it('shows signing in text while loading', async () => {
		const user = userEvent.setup();
		mockLogin.mockReturnValue(new Promise(() => {})); // never resolves

		render(<LoginPage />);

		await user.type(screen.getByLabelText(/email/i), 'a@b.com');
		await user.type(screen.getByLabelText(/password/i), 'pass1234');
		await user.click(screen.getByRole('button', { name: /sign in/i }));

		expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
	});
});
