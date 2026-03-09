import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/api/http-client', () => ({
	request: vi.fn(),
}));

import { request } from '@/shared/api/http-client';
import { authApi } from '../auth.api';

const mockRequest = request as ReturnType<typeof vi.fn>;

const mockTokenPair = { accessToken: 'at', refreshToken: 'rt' };
const mockUser = { userId: 'u1', email: 'a@b.com', displayName: 'Alice' };

describe('authApi', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('register', () => {
		it('calls POST /auth/register with body and skipAuth', async () => {
			mockRequest.mockResolvedValue(mockTokenPair);
			const body = { email: 'a@b.com', password: 'pass1234', captchaToken: 'test-token' };

			const result = await authApi.register(body);

			expect(mockRequest).toHaveBeenCalledWith('/auth/register', {
				method: 'POST',
				body,
				skipAuth: true,
			});
			expect(result).toEqual(mockTokenPair);
		});

		it('includes displayName when provided', async () => {
			mockRequest.mockResolvedValue(mockTokenPair);
			const body = { email: 'a@b.com', password: 'pass1234', displayName: 'Bob', captchaToken: 'test-token' };

			await authApi.register(body);

			expect(mockRequest).toHaveBeenCalledWith('/auth/register', {
				method: 'POST',
				body,
				skipAuth: true,
			});
		});
	});

	describe('login', () => {
		it('calls POST /auth/login with body and skipAuth', async () => {
			mockRequest.mockResolvedValue(mockTokenPair);
			const body = { email: 'a@b.com', password: 'pass1234', captchaToken: 'test-token' };

			const result = await authApi.login(body);

			expect(mockRequest).toHaveBeenCalledWith('/auth/login', {
				method: 'POST',
				body,
				skipAuth: true,
			});
			expect(result).toEqual(mockTokenPair);
		});
	});

	describe('refresh', () => {
		it('calls POST /auth/refresh with refreshToken and skipAuth', async () => {
			mockRequest.mockResolvedValue(mockTokenPair);
			const body = { refreshToken: 'old-rt', captchaToken: 'test-token' };

			const result = await authApi.refresh(body);

			expect(mockRequest).toHaveBeenCalledWith('/auth/refresh', {
				method: 'POST',
				body,
				skipAuth: true,
			});
			expect(result).toEqual(mockTokenPair);
		});
	});

	describe('logout', () => {
		it('calls POST /auth/logout', async () => {
			mockRequest.mockResolvedValue(undefined);

			await authApi.logout();

			expect(mockRequest).toHaveBeenCalledWith('/auth/logout', { method: 'POST' });
		});
	});

	describe('getMe', () => {
		it('calls GET /auth/me and returns user', async () => {
			mockRequest.mockResolvedValue(mockUser);

			const result = await authApi.getMe();

			expect(mockRequest).toHaveBeenCalledWith('/auth/me');
			expect(result).toEqual(mockUser);
		});
	});

	describe('updateProfile', () => {
		it('calls PATCH /users/me with body', async () => {
			const updated = { ...mockUser, displayName: 'New Name' };
			mockRequest.mockResolvedValue(updated);
			const body = { displayName: 'New Name' };

			const result = await authApi.updateProfile(body);

			expect(mockRequest).toHaveBeenCalledWith('/users/me', {
				method: 'PATCH',
				body,
			});
			expect(result.displayName).toBe('New Name');
		});
	});
});
